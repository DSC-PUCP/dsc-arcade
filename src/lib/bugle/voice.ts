// Voz de Bugle con speechSynthesis.
// Automático: neuronal (Edge "Natural/Online") > Google > sistema, prefiriendo voces masculinas.
// El encargado puede fijar una voz, el tono y la velocidad en el panel 🐧 (localStorage).
import { blog } from './log'

const LS = 'dsc-arcade:bugle:'
const MALE = /jorge|alvaro|álvaro|gonzalo|alex|raul|raúl|pablo|tomas|tomás|gerardo|emilio|lorenzo|mateo|andres|andrés|jaime|carlos|federico|liam|cecilio|gerard|arnau|dario|darío|enrique|jose|josé|saul|saúl|teo|male|hombre/
const FEMALE = /dalia|elvira|helena|sabina|laura|camila|paloma|salome|salomé|elena|monica|mónica|paulina|lucia|lucía|ximena|marina|beatriz|abril|irene|larissa|nuria|candela|catalina|valentina|renata|sofia|sofía|female|mujer|google español/

let voice: SpeechSynthesisVoice | null = null
let all: SpeechSynthesisVoice[] = []
const subs = new Set<() => void>()

export const prefs = {
  voice: localStorage.getItem(LS + 'voiceName') ?? '', // '' = automático
  pitch: Number(localStorage.getItem(LS + 'pitch') ?? 1),
  rate: Number(localStorage.getItem(LS + 'rate') ?? 1.05),
}

function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase()
  let s = 0
  if (/natural|online|neural/.test(n)) s += 100
  if (/google/.test(n)) s += 30
  if (MALE.test(n)) s += 45
  else if (FEMALE.test(n)) s -= 10
  if (v.lang.toLowerCase() === 'es-pe') s += 30
  else if (/^es-(419|mx|us|co|ar|cl)/i.test(v.lang)) s += 20
  else if (/^es-es/i.test(v.lang)) s += 10
  return s
}

function pick() {
  if (typeof speechSynthesis === 'undefined') return
  all = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'))
  all.sort((a, b) => score(b) - score(a))
  const prev = voice?.name
  voice = (prefs.voice && all.find((v) => v.name === prefs.voice)) || all[0] || null
  if (voice && voice.name !== prev) blog('voz', `Voz elegida: ${voice.name} (${voice.lang})${prefs.voice ? ' [fijada]' : ' [automática]'}`)
  subs.forEach((f) => f())
}

if (typeof speechSynthesis !== 'undefined') {
  pick()
  speechSynthesis.addEventListener('voiceschanged', pick)
}

export const voiceName = () => voice?.name ?? '(voz por defecto)'
export const listVoices = () => all
export function onVoices(f: () => void) {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}

export function setVoicePrefs(p: Partial<typeof prefs>) {
  Object.assign(prefs, p)
  localStorage.setItem(LS + 'voiceName', prefs.voice)
  localStorage.setItem(LS + 'pitch', String(prefs.pitch))
  localStorage.setItem(LS + 'rate', String(prefs.rate))
  pick()
}

/** Divide en trozos cortos (Chrome corta los utterances de más de ~15 s). */
function chunks(text: string, max = 140): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    if ((cur + ' ' + p).trim().length <= max) cur = (cur + ' ' + p).trim()
    else {
      if (cur) out.push(cur)
      cur = ''
      for (const w of p.split(' ')) {
        if ((cur + ' ' + w).trim().length > max) {
          out.push(cur.trim())
          cur = w
        } else cur = (cur + ' ' + w).trim()
      }
    }
  }
  if (cur) out.push(cur)
  return out
}

let token = 0

/** Habla y resuelve al terminar (o al cancelar). */
export function speak(text: string): Promise<void> {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve()
  const my = ++token
  speechSynthesis.cancel()
  if (!voice) pick()
  const list = chunks(text)
  const t0 = performance.now()
  return new Promise((resolve) => {
    let i = 0
    let guard = 0 // Chrome a veces no dispara onend: tope de seguridad por trozo
    const next = () => {
      clearTimeout(guard)
      if (my !== token || i >= list.length) {
        blog('voz', my !== token ? 'Habla cortada' : `Terminó de hablar (${Math.round(performance.now() - t0)} ms, ${list.length} trozo/s)`)
        return resolve()
      }
      const u = new SpeechSynthesisUtterance(list[i++])
      if (voice) {
        u.voice = voice
        u.lang = voice.lang
      } else u.lang = 'es-PE'
      u.rate = prefs.rate
      u.pitch = prefs.pitch
      u.onend = next
      u.onerror = next
      guard = window.setTimeout(next, 4000 + u.text.length * 120)
      speechSynthesis.speak(u)
    }
    next()
  })
}

export function stopSpeaking() {
  token++
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}
