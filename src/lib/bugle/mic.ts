// Micrófono de Bugle: escucha ambiental con VAD por energía (umbral adaptativo al ruido) y grabación pulsar-para-hablar.
// Nada se guarda: los blobs se mandan a transcribir y se descartan.

let stream: MediaStream | null = null
let actx: AudioContext | null = null
let analyser: AnalyserNode | null = null

export async function getStream() {
  if (stream && stream.getTracks().some((t) => t.readyState === 'live')) return stream
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  })
  actx = new AudioContext()
  const src = actx.createMediaStreamSource(stream)
  analyser = actx.createAnalyser()
  analyser.fftSize = 1024
  src.connect(analyser)
  return stream
}

export function releaseStream() {
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  void actx?.close()
  actx = null
  analyser = null
}

function mime() {
  const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return opts.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? ''
}

const buf = new Float32Array(1024)
function rms() {
  if (!analyser) return 0
  analyser.getFloatTimeDomainData(buf)
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

/** Graba hasta stop(); resuelve con el blob (o null si no hubo audio). */
export function record(s: MediaStream) {
  const type = mime()
  const rec = new MediaRecorder(s, type ? { mimeType: type } : undefined)
  const parts: Blob[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) parts.push(e.data)
  }
  const done = new Promise<Blob | null>((resolve) => {
    rec.onstop = () => resolve(parts.length ? new Blob(parts, { type: rec.mimeType || type || 'audio/webm' }) : null)
  })
  rec.start()
  return {
    stop: () => {
      if (rec.state !== 'inactive') rec.stop()
      return done
    },
  }
}

export interface AmbientOpts {
  threshold: number
  maxSeconds: number
  isBlocked: () => boolean
  onUtterance: (b: Blob, seconds: number) => void
  onDiscard?: (why: string) => void
  onLevel?: (voice: boolean) => void
}

/** Escucha continua: graba solo los tramos con voz (≤ maxSeconds). Devuelve una función para detener. */
export async function startAmbient(o: AmbientOpts) {
  const s = await getStream()
  let floor = 0.01
  let cur: ReturnType<typeof record> | null = null
  let startedAt = 0
  let voiceMs = 0
  let lastVoice = 0
  let stopped = false

  const finish = async (keep: boolean, why = '') => {
    const r = cur
    cur = null
    if (!r) return
    const secs = (performance.now() - startedAt) / 1000
    const b = await r.stop()
    if (keep && b && !stopped && !o.isBlocked()) o.onUtterance(b, secs)
    else if (!stopped) o.onDiscard?.(why || (o.isBlocked() ? 'Bugle estaba hablando' : 'sin audio'))
  }

  const id = window.setInterval(() => {
    const now = performance.now()
    if (o.isBlocked()) {
      if (cur) void finish(false, 'half-duplex (Bugle habla)') // half-duplex: descartar lo que se grabó mientras Bugle habla
      return
    }
    const v = rms()
    const isVoice = v > Math.max(o.threshold, floor * 3)
    if (!isVoice) floor = floor * 0.98 + v * 0.02 // piso de ruido adaptativo
    o.onLevel?.(isVoice)
    if (isVoice) {
      lastVoice = now
      if (!cur) {
        cur = record(s)
        startedAt = now
        voiceMs = 0
      }
      voiceMs += 50
    }
    if (cur) {
      const len = now - startedAt
      const why = voiceMs > 500 ? '' : `muy poca voz (${voiceMs} ms)`
      if (len > o.maxSeconds * 1000) void finish(voiceMs > 500, why)
      else if (now - lastVoice > 900) void finish(voiceMs > 500, why)
    }
  }, 50)

  return () => {
    stopped = true
    clearInterval(id)
    void finish(false)
  }
}
