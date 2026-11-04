// Orquestador de "Bugle en vivo" (todo esto vive en el navegador).
// Decide cuándo habla, arma el contexto (con la bolsa de hechos de los juegos), llama a /api/bugle/* y cae al banco offline.
import { useSyncExternalStore } from 'react'
import { config } from '../config'
import type { Mood } from '../../components/Mascot'
import { offlineLine, type LineKind } from '../../data/bugleLines'
import { BIG_EVENTS, describeEvent, onBugle, type BugleEvent } from './bus'
import { speak, stopSpeaking } from './voice'
import { getStream, record, releaseStream, startAmbient } from './mic'
import { blog } from './log'

const cfg = config.bugle
const LS = 'dsc-arcade:bugle:'
const MOODS: Mood[] = ['happy', 'sad', 'think', 'party', 'typing', 'detective', 'gift', 'point']
const BAG_MAX = 20
const BAG_MINUTES = 10

export interface BugleState {
  enabled: boolean
  micOn: boolean
  voiceOn: boolean
  hasKey: boolean
  speaking: boolean
  mood: Mood
  recording: boolean // pulsar-para-hablar
  thinking: boolean
  hearing: boolean // VAD detecta voz
  micError: string | null
  source: 'ia' | 'offline' | null
  lastLine: string | null
}

let state: BugleState = {
  enabled: localStorage.getItem(LS + 'enabled') === '1',
  micOn: localStorage.getItem(LS + 'mic') !== '0',
  voiceOn: localStorage.getItem(LS + 'voice') !== '0',
  hasKey: !!localStorage.getItem(LS + 'key'),
  speaking: false,
  mood: 'happy',
  recording: false,
  thinking: false,
  hearing: false,
  micError: null,
  source: null,
  lastLine: null,
}
const subs = new Set<() => void>()
function set(p: Partial<BugleState>) {
  state = { ...state, ...p }
  subs.forEach((f) => f())
}
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}
export function useBugle() {
  return useSyncExternalStore(subscribe, () => state)
}

// ---------- contexto ----------
const GAME_LABEL: Record<string, string> = {
  hub: 'menú principal', ruleta: 'Ruleta de premios', galeria: 'Galería de fotos', debug: 'Debug Challenge',
  speedrun: 'Tech Speedrun', logos: 'Adivina el Logo', truth: '¿Verdad o Alucinación?',
}
let game = 'hub'
/** Bolsa de hechos: todo lo que pasó en los juegos en los últimos minutos. */
let bag: { at: number; e: BugleEvent }[] = []
let lastInput = Date.now()
let lastSpoke = 0
let quietUntil = 0
let busy = false
let transcripts: { at: number; text: string }[] = []
let history: { role: 'user' | 'assistant'; content: string }[] = []
const said: string[] = []
let lastContext: Record<string, unknown> | null = null
export const getLastContext = () => lastContext

export function setGame(g: string) {
  if (g === game) return
  game = g
  blog('estado', `Pantalla: ${GAME_LABEL[g] ?? g}`)
}

function topSpeedrun() {
  try {
    const b = JSON.parse(localStorage.getItem('dsc-arcade:speed-board') ?? '[]') as { name: string; wpm: number; score: number }[]
    return [...b].sort((a, c) => c.score - a.score).slice(0, 3).map((x) => `${x.name} ${x.wpm} WPM`)
  } catch {
    return []
  }
}

const ago = (ms: number) => (ms < 60_000 ? `hace ${Math.round(ms / 1000)} s` : `hace ${Math.round(ms / 60_000)} min`)

function context() {
  const now = Date.now()
  transcripts = transcripts.filter((t) => now - t.at < cfg.transcriptMemorySeconds * 1000)
  bag = bag.filter((b) => now - b.at < BAG_MINUTES * 60_000).slice(-BAG_MAX)
  const nuevos = bag.filter((b) => b.at > lastSpoke)
  const antes = bag.filter((b) => b.at <= lastSpoke).slice(-6)
  const aciertos = bag.filter((b) => b.e.type === 'respuesta' && b.e.acierto).length
  const fallos = bag.filter((b) => (b.e.type === 'respuesta' && !b.e.acierto) || b.e.type === 'bug_fallado').length
  const ctx = {
    evento: config.eventName,
    juegoActivo: GAME_LABEL[game] ?? game,
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    minutosSinInteraccion: Math.floor((now - lastInput) / 60_000),
    hechosNuevos: nuevos.map((b) => `${describeEvent(b.e)} (${ago(now - b.at)})`),
    hechosAnteriores: antes.map((b) => `${describeEvent(b.e)} (${ago(now - b.at)})`),
    resumenUltimosMinutos: bag.length ? `${aciertos} aciertos y ${fallos} fallos en ${BAG_MINUTES} min` : 'nadie ha jugado en los últimos minutos',
    topSpeedrun: topSpeedrun(),
    seEscucha: transcripts.slice(-3).map((t) => t.text).join(' / ') || undefined,
    frasesRecientesTuyas: said.slice(-4),
  }
  lastContext = ctx
  return ctx
}

// ---------- API ----------
async function api(path: string, body: BodyInit, type: string) {
  const key = localStorage.getItem(LS + 'key')
  if (!key) throw new Error('sin STAND_KEY')
  if (!navigator.onLine) throw new Error('sin red')
  const ctl = new AbortController()
  const t = window.setTimeout(() => ctl.abort(), 9000)
  const t0 = performance.now()
  try {
    const r = await fetch(`/api/bugle/${path}`, { method: 'POST', headers: { 'content-type': type, 'x-stand-key': key }, body, signal: ctl.signal })
    const ms = Math.round(performance.now() - t0)
    const data = (await r.json().catch(() => ({}))) as Record<string, unknown>
    blog(r.ok ? 'api' : 'error', `POST /api/bugle/${path} → ${r.status} (${ms} ms)`, data)
    if (!r.ok) throw new Error(r.status === 401 ? 'STAND_KEY incorrecta (401)' : r.status === 429 ? 'límite de Groq (429)' : r.status === 422 ? 'filtro de salida (422)' : `http ${r.status} ${String(data.error ?? '')}`)
    return data
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('timeout 9 s')
    throw e
  } finally {
    clearTimeout(t)
  }
}

async function fetchLine(mode: 'ambient' | 'chat', message?: string): Promise<{ frase: string; emocion: Mood } | { error: string }> {
  try {
    const ctx = context()
    blog('turno', `Pidiendo frase (${mode === 'chat' ? 'conversación' : 'ambiental'})`, ctx)
    const d = await api('line', JSON.stringify({ mode, context: ctx, message, history: history.slice(-8) }), 'application/json')
    const frase = String(d.frase ?? '').trim()
    if (!frase) return { error: 'respuesta vacía' }
    return { frase, emocion: MOODS.includes(d.emocion as Mood) ? (d.emocion as Mood) : 'happy' }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

const HALLUCINATIONS = /subt[ií]tulos|gracias por ver|suscr[ií]bete|amara\.org|^\W*$/i
async function transcribe(b: Blob, why: string): Promise<string> {
  try {
    blog('stt', `Transcribiendo ${why} (${Math.round(b.size / 1024)} KB)`)
    const d = await api('transcribe', b, b.type || 'audio/webm')
    const text = String(d.text ?? '').trim()
    if (HALLUCINATIONS.test(text) || text.length < 3) {
      blog('stt', `Descartado (vacío o alucinación de Whisper): "${text}"`)
      return ''
    }
    blog('stt', `"${text}"`)
    return text
  } catch (e) {
    blog('error', `Transcripción falló: ${(e as Error).message}`)
    return ''
  }
}

// ---------- hablar ----------
async function say(l: { frase: string; emocion: Mood }, source: 'ia' | 'offline') {
  said.push(l.frase)
  if (said.length > 6) said.shift()
  lastSpoke = Date.now()
  blog(source, `«${l.frase}» [${l.emocion}]`)
  set({ lastLine: l.frase, source })
  if (!state.voiceOn) {
    blog('voz', 'Voz off: no se dice en voz alta')
    return
  }
  set({ speaking: true, mood: l.emocion })
  await speak(l.frase)
  quietUntil = performance.now() + 500 // half-duplex: no escuchar ~500 ms después de hablar
  set({ speaking: false })
}

function kindFor(e: BugleEvent | undefined): LineKind | undefined {
  if (!e) return undefined
  if (e.type === 'eliminado' || e.type === 'bug_fallado') return 'consuelo'
  if (e.type === 'quiz') return e.correctas >= e.total / 2 ? 'celebracion' : 'consuelo'
  if (e.type === 'respuesta') return e.acierto ? 'celebracion' : 'consuelo'
  if (e.type === 'speedrun' || e.type === 'speedrun_guardado' || e.type === 'debug_inicio') return 'reto'
  return 'celebracion'
}

async function ambientTurn(reason: string) {
  if (busy || !state.enabled || !state.voiceOn || state.recording) {
    blog('turno', `Turno omitido (${reason}): ${busy ? 'ocupado' : !state.voiceOn ? 'voz off' : state.recording ? 'grabando' : 'desactivado'}`)
    return
  }
  busy = true
  blog('turno', `Turno ambiental: ${reason}`)
  try {
    const recent = bag.filter((b) => b.at > lastSpoke).pop()?.e
    const l = await fetchLine('ambient')
    if (!state.enabled || state.recording) return
    if ('frase' in l) await say(l, 'ia')
    else {
      const kind = kindFor(recent)
      blog('offline', `Banco offline (${l.error})${kind ? `, tipo ${kind}` : ''}`)
      await say(offlineLine(kind), 'offline')
    }
  } finally {
    busy = false
  }
}

export function forceLine() {
  void ambientTurn('forzado desde el panel')
}

// ---------- pulsar para hablar ----------
let ptt: ReturnType<typeof record> | null = null
let pttAt = 0
export async function pttStart() {
  if (!state.enabled || state.recording) return
  stopSpeaking()
  set({ speaking: false, recording: true, micError: null })
  blog('chat', 'Pulsar para hablar: grabando')
  try {
    const s = await getStream()
    if (!state.recording) return
    ptt = record(s)
    pttAt = performance.now()
  } catch (e) {
    blog('error', `No se pudo abrir el micrófono: ${(e as Error).message}`)
    set({ recording: false, micError: 'No se pudo abrir el micrófono' })
  }
}

export async function pttStop() {
  if (!state.recording) return
  const r = ptt
  ptt = null
  const ms = Math.round(performance.now() - pttAt)
  set({ recording: false })
  if (!r) return
  const b = await r.stop()
  if (!state.micOn) releaseStream()
  if (!b || ms < 400) {
    blog('chat', `Grabación descartada (${ms} ms, muy corta)`)
    return
  }
  blog('chat', `Grabación de ${(ms / 1000).toFixed(1)} s`)
  busy = true
  set({ thinking: true, mood: 'think' })
  try {
    const text = await transcribe(b, 'pulsar-para-hablar')
    let l: { frase: string; emocion: Mood } | null = null
    if (text) {
      blog('chat', `Persona: "${text}"`)
      const res = await fetchLine('chat', text)
      if ('frase' in res) {
        l = res
        history.push({ role: 'user', content: text }, { role: 'assistant', content: res.frase })
        history = history.slice(-8) // ≤4 turnos
      } else blog('offline', `Conversación sin IA (${res.error})`)
    }
    set({ thinking: false })
    if (l) await say(l, 'ia')
    else
      await say(
        text
          ? { frase: 'Uy, se me cruzaron los cables y no te entendí bien. Mejor juguemos algo, ¿ya?', emocion: 'think' }
          : { frase: 'No te escuché bien, causa. Mantén el botón y háblame cerquita.', emocion: 'think' },
        'offline',
      )
  } finally {
    set({ thinking: false })
    busy = false
  }
}

// ---------- ciclo de vida ----------
let stopAmbient: (() => void) | null = null
let ticker = 0
let offBus: (() => void) | null = null
let eventTimer = 0

// La bolsa se llena siempre (aunque Bugle esté apagado), para que al activarlo ya tenga contexto.
onBugle((e) => {
  bag.push({ at: Date.now(), e })
  if (bag.length > BAG_MAX) bag.shift()
  blog('evento', describeEvent(e), e)
})

async function syncMic() {
  const want = state.enabled && state.micOn
  if (want && !stopAmbient) {
    try {
      stopAmbient = await startAmbient({
        threshold: cfg.vadThreshold,
        maxSeconds: cfg.maxUtteranceSeconds,
        isBlocked: () => state.speaking || state.recording || state.thinking || performance.now() < quietUntil,
        onLevel: (v) => {
          if (v !== state.hearing) set({ hearing: v })
        },
        onDiscard: (why) => blog('mic', `Fragmento descartado: ${why}`),
        onUtterance: (b, secs) => {
          blog('mic', `Voz detectada: fragmento de ${secs.toFixed(1)} s`)
          void transcribe(b, 'ambiente').then((text) => {
            if (text) transcripts.push({ at: Date.now(), text: text.slice(0, 200) })
          })
        },
      })
      blog('mic', 'Escucha ambiental encendida')
      set({ micError: null })
    } catch (e) {
      blog('error', `Micrófono bloqueado o no disponible: ${(e as Error).message}`)
      set({ micError: 'Micrófono bloqueado o no disponible', micOn: false })
    }
  } else if (!want && stopAmbient) {
    stopAmbient()
    stopAmbient = null
    transcripts = []
    if (!state.recording) releaseStream()
    blog('mic', 'Escucha ambiental apagada (transcripciones borradas)')
    set({ hearing: false })
  }
}

function start() {
  if (ticker) return
  blog('estado', `Bugle en vivo activado (cada ${cfg.ambientSeconds} s, mínimo ${cfg.minGapSeconds} s entre frases)`)
  lastSpoke = Date.now() - cfg.ambientSeconds * 1000 + 6000 // primera frase a los ~6 s
  ticker = window.setInterval(() => {
    if (Date.now() - lastSpoke >= cfg.ambientSeconds * 1000) void ambientTurn(`reloj (${cfg.ambientSeconds} s)`)
  }, 2000)
  offBus = onBugle((e) => {
    if (!BIG_EVENTS.includes(e.type)) return // los eventos chicos solo se suman a la bolsa
    if (Date.now() - lastSpoke < cfg.minGapSeconds * 1000) {
      blog('turno', `Evento "${e.type}" a la bolsa; habló hace menos de ${cfg.minGapSeconds} s`)
      return
    }
    clearTimeout(eventTimer)
    eventTimer = window.setTimeout(() => void ambientTurn(`evento "${e.type}"`), 1500)
  })
  void syncMic()
}

function stop() {
  clearInterval(ticker)
  ticker = 0
  clearTimeout(eventTimer)
  offBus?.()
  offBus = null
  stopSpeaking()
  history = []
  set({ speaking: false })
  blog('estado', 'Bugle en vivo desactivado')
  void syncMic()
}

const markInput = () => {
  lastInput = Date.now()
}
;(['pointerdown', 'keydown'] as const).forEach((e) => window.addEventListener(e, markInput, { passive: true }))

export function setEnabled(on: boolean) {
  localStorage.setItem(LS + 'enabled', on ? '1' : '0')
  set({ enabled: on })
  if (on) start()
  else stop()
}
export function setMicOn(on: boolean) {
  localStorage.setItem(LS + 'mic', on ? '1' : '0')
  set({ micOn: on })
  void syncMic()
}
export function setVoiceOn(on: boolean) {
  localStorage.setItem(LS + 'voice', on ? '1' : '0')
  if (!on) stopSpeaking() // silencio inmediato
  blog('estado', `Voz ${on ? 'on' : 'off'}`)
  set({ voiceOn: on, speaking: on ? state.speaking : false })
}
export function setStandKey(k: string) {
  if (k) localStorage.setItem(LS + 'key', k)
  else localStorage.removeItem(LS + 'key')
  blog('estado', k ? 'STAND_KEY guardada' : 'STAND_KEY borrada (solo banco offline)')
  set({ hasKey: !!k })
}

/** Arranca si quedó activado de una sesión anterior. El audio y el mic requieren un gesto: se espera al primer clic o tecla. */
export function bootBugle() {
  if (!state.enabled) return
  blog('estado', 'Bugle quedó activado: arranca con el primer clic o tecla')
  const go = () => start()
  window.addEventListener('pointerdown', go, { once: true })
  window.addEventListener('keydown', go, { once: true })
}
