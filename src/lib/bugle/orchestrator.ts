// Orquestador de "Bugle en vivo": decide cuándo habla, arma el contexto, llama a la API y cae al banco offline.
import { useSyncExternalStore } from 'react'
import { config } from '../config'
import type { Mood } from '../../components/Mascot'
import { offlineLine, type LineKind } from '../../data/bugleLines'
import { describeEvent, onBugle, type BugleEvent } from './bus'
import { speak, stopSpeaking } from './voice'
import { getStream, record, releaseStream, startAmbient } from './mic'

const cfg = config.bugle
const LS = 'dsc-arcade:bugle:'
const MOODS: Mood[] = ['happy', 'sad', 'think', 'party', 'typing', 'detective', 'gift', 'point']

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
}
const subs = new Set<() => void>()
function set(p: Partial<BugleState>) {
  state = { ...state, ...p }
  subs.forEach((f) => f())
}
export function useBugle() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => {
        subs.delete(f)
      }
    },
    () => state,
  )
}

// ---------- contexto ----------
const GAME_LABEL: Record<string, string> = {
  hub: 'menú principal', ruleta: 'Ruleta de premios', galeria: 'Galería de fotos', debug: 'Debug Challenge',
  speedrun: 'Tech Speedrun', logos: 'Adivina el Logo', truth: '¿Verdad o Alucinación?',
}
let game = 'hub'
let lastEvent: { e: BugleEvent; at: number } | null = null
let lastInput = Date.now()
let lastSpoke = 0
let quietUntil = 0
let busy = false
let transcripts: { at: number; text: string }[] = []
let history: { role: 'user' | 'assistant'; content: string }[] = []
const said: string[] = []

export function setGame(g: string) {
  game = g
}

function topSpeedrun() {
  try {
    const b = JSON.parse(localStorage.getItem('dsc-arcade:speed-board') ?? '[]') as { name: string; wpm: number; score: number }[]
    return [...b].sort((a, c) => c.score - a.score).slice(0, 3).map((x) => `${x.name} ${x.wpm} WPM`)
  } catch {
    return []
  }
}

function context() {
  const now = Date.now()
  transcripts = transcripts.filter((t) => now - t.at < cfg.transcriptMemorySeconds * 1000)
  return {
    evento: config.eventName,
    juegoActivo: GAME_LABEL[game] ?? game,
    ultimoEvento: lastEvent && now - lastEvent.at < 90_000 ? describeEvent(lastEvent.e) : 'nada reciente',
    minutosSinJugar: Math.floor((now - lastInput) / 60_000),
    topSpeedrun: topSpeedrun(),
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    seEscucha: transcripts.slice(-3).map((t) => t.text).join(' / ') || undefined,
    frasesRecientes: said.slice(-3),
  }
}

// ---------- API ----------
async function api(path: string, body: BodyInit, type: string) {
  const key = localStorage.getItem(LS + 'key')
  if (!key || !navigator.onLine) throw new Error('offline')
  const ctl = new AbortController()
  const t = window.setTimeout(() => ctl.abort(), 9000)
  try {
    const r = await fetch(`/api/bugle/${path}`, { method: 'POST', headers: { 'content-type': type, 'x-stand-key': key }, body, signal: ctl.signal })
    if (r.status === 401) console.warn('[bugle] STAND_KEY incorrecta')
    if (!r.ok) throw new Error(`http ${r.status}`)
    return (await r.json()) as Record<string, unknown>
  } finally {
    clearTimeout(t)
  }
}

async function fetchLine(mode: 'ambient' | 'chat', message?: string): Promise<{ frase: string; emocion: Mood } | null> {
  try {
    const d = await api('line', JSON.stringify({ mode, context: context(), message, history: history.slice(-8) }), 'application/json')
    const frase = String(d.frase ?? '').trim()
    if (!frase) return null
    const emocion = MOODS.includes(d.emocion as Mood) ? (d.emocion as Mood) : 'happy'
    return { frase, emocion }
  } catch (e) {
    console.info('[bugle] usando banco offline:', (e as Error).message)
    return null
  }
}

const HALLUCINATIONS = /subt[ií]tulos|gracias por ver|suscr[ií]bete|amara\.org|^\W*$/i
async function transcribe(b: Blob): Promise<string> {
  try {
    const d = await api('transcribe', b, b.type || 'audio/webm')
    const text = String(d.text ?? '').trim()
    return HALLUCINATIONS.test(text) || text.length < 3 ? '' : text
  } catch {
    return ''
  }
}

// ---------- hablar ----------
async function say(l: { frase: string; emocion: Mood }, source: 'ia' | 'offline') {
  said.push(l.frase)
  if (said.length > 6) said.shift()
  lastSpoke = Date.now()
  if (!state.voiceOn) return
  set({ speaking: true, mood: l.emocion, source })
  await speak(l.frase)
  quietUntil = performance.now() + 500 // half-duplex: no escuchar ~500 ms después de hablar
  set({ speaking: false })
}

function kindFor(e: BugleEvent | null): LineKind | undefined {
  if (!e) return undefined
  if (e.type === 'eliminado') return 'consuelo'
  if (e.type === 'quiz') return e.correctas >= e.total / 2 ? 'celebracion' : 'consuelo'
  if (e.type === 'speedrun') return 'reto'
  return 'celebracion'
}

async function ambientTurn(fromEvent = false) {
  if (busy || !state.enabled || !state.voiceOn || state.recording) return
  busy = true
  try {
    const l = await fetchLine('ambient')
    if (!state.enabled || state.recording) return
    if (l) await say(l, 'ia')
    else await say(offlineLine(fromEvent ? kindFor(lastEvent?.e ?? null) : undefined), 'offline')
  } finally {
    busy = false
  }
}

// ---------- pulsar para hablar ----------
let ptt: ReturnType<typeof record> | null = null
let pttAt = 0
export async function pttStart() {
  if (!state.enabled || state.recording) return
  stopSpeaking()
  set({ speaking: false, recording: true, micError: null })
  try {
    const s = await getStream()
    if (!state.recording) return
    ptt = record(s)
    pttAt = performance.now()
  } catch {
    set({ recording: false, micError: 'No se pudo abrir el micrófono' })
  }
}

export async function pttStop() {
  if (!state.recording) return
  const r = ptt
  ptt = null
  const long = performance.now() - pttAt > 400
  set({ recording: false })
  if (!r) return
  const b = await r.stop()
  if (!state.micOn) releaseStream()
  if (!b || !long) return
  busy = true
  set({ thinking: true, mood: 'think' })
  try {
    const text = await transcribe(b)
    let l: { frase: string; emocion: Mood } | null = null
    let src: 'ia' | 'offline' = 'ia'
    if (text) {
      l = await fetchLine('chat', text)
      if (l) {
        history.push({ role: 'user', content: text }, { role: 'assistant', content: l.frase })
        history = history.slice(-8) // ≤4 turnos
      }
    }
    if (!l) {
      src = 'offline'
      l = text
        ? { frase: 'Uy, se me cruzaron los cables y no te entendí bien. Mejor juguemos algo, ¿ya?', emocion: 'think' }
        : { frase: 'No te escuché bien, causa. Mantén el botón y háblame cerquita.', emocion: 'think' }
    }
    set({ thinking: false })
    await say(l, src)
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
        onUtterance: (b) => {
          void transcribe(b).then((text) => {
            if (text) transcripts.push({ at: Date.now(), text: text.slice(0, 200) })
          })
        },
      })
      set({ micError: null })
    } catch {
      set({ micError: 'Micrófono bloqueado o no disponible', micOn: false })
    }
  } else if (!want && stopAmbient) {
    stopAmbient()
    stopAmbient = null
    transcripts = []
    if (!state.recording) releaseStream()
    set({ hearing: false })
  }
}

function start() {
  if (ticker) return
  lastSpoke = Date.now() - cfg.ambientSeconds * 1000 + 6000 // primera frase a los ~6 s
  ticker = window.setInterval(() => {
    if (Date.now() - lastSpoke >= cfg.ambientSeconds * 1000) void ambientTurn()
  }, 2000)
  offBus = onBugle((e) => {
    lastEvent = { e, at: Date.now() }
    if (e.type === 'bug_chapado') return // frecuente: solo contexto, no dispara
    if (Date.now() - lastSpoke < cfg.minGapSeconds * 1000) return
    clearTimeout(eventTimer)
    eventTimer = window.setTimeout(() => void ambientTurn(true), 1200)
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
  set({ voiceOn: on, speaking: on ? state.speaking : false })
}
export function setStandKey(k: string) {
  if (k) localStorage.setItem(LS + 'key', k)
  else localStorage.removeItem(LS + 'key')
  set({ hasKey: !!k })
}

/** Arranca si quedó activado de una sesión anterior. El mic requiere un gesto: se pide al primer clic. */
export function bootBugle() {
  if (!state.enabled) return
  const go = () => start()
  window.addEventListener('pointerdown', go, { once: true })
  window.addEventListener('keydown', go, { once: true })
}
