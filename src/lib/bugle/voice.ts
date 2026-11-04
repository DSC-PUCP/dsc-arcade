// Voz de Bugle con speechSynthesis. Prioridad: Edge "Natural/Online" > Google español > voces del sistema.
let voice: SpeechSynthesisVoice | null = null

function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase()
  let s = 0
  if (/natural|online|neural/.test(n)) s += 100
  if (/google/.test(n)) s += 50
  if (v.lang.toLowerCase() === 'es-pe') s += 30
  else if (/^es-(419|mx|us|co|ar|cl)/i.test(v.lang)) s += 20
  else if (/^es-es/i.test(v.lang)) s += 10
  if (/dalia|jorge|alex|camila|elena|salome|lorenzo/.test(n)) s += 5
  if (!v.localService) s += 2
  return s
}

function pick() {
  if (typeof speechSynthesis === 'undefined') return
  const es = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'))
  voice = es.sort((a, b) => score(b) - score(a))[0] ?? null
}

if (typeof speechSynthesis !== 'undefined') {
  pick()
  speechSynthesis.addEventListener('voiceschanged', pick)
}

export const voiceName = () => voice?.name ?? '(voz por defecto)'

/** Divide en trozos cortos (Chrome corta los utterances de más de ~15 s). */
function chunks(text: string, max = 140): string[] {
  const parts = text.match(/[^.!?¡¿]+[.!?]*|[¡¿][^.!?]+[.!?]*/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    if ((cur + ' ' + p).trim().length <= max) cur = (cur + ' ' + p).trim()
    else {
      if (cur) out.push(cur)
      if (p.length <= max) cur = p
      else {
        const words = p.split(' ')
        cur = ''
        for (const w of words) {
          if ((cur + ' ' + w).length > max) {
            out.push(cur.trim())
            cur = w
          } else cur += ' ' + w
        }
        cur = cur.trim()
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
  return new Promise((resolve) => {
    let i = 0
    // Chrome a veces no dispara onend: tope de seguridad por trozo
    let guard = 0
    const next = () => {
      clearTimeout(guard)
      if (my !== token || i >= list.length) return resolve()
      const u = new SpeechSynthesisUtterance(list[i++])
      if (voice) {
        u.voice = voice
        u.lang = voice.lang
      } else u.lang = 'es-PE'
      u.rate = 1.05
      u.pitch = 1.15
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
