let ctx: AudioContext | null = null
let muted = localStorage.getItem('dsc-arcade:muted') === '1'

export const isMuted = () => muted
export function setMuted(m: boolean) {
  muted = m
  localStorage.setItem('dsc-arcade:muted', m ? '1' : '0')
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.08, delay = 0) {
  if (muted) return
  ctx ??= new AudioContext()
  const t = ctx.currentTime + delay
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t)
  o.stop(t + dur)
}

export const sfx = {
  click: () => tone(660, 0.05, 'square', 0.04),
  tick: () => tone(1200, 0.03, 'square', 0.03),
  key: () => tone(900 + Math.random() * 200, 0.025, 'triangle', 0.03),
  error: () => { tone(180, 0.18, 'sawtooth', 0.07); tone(120, 0.25, 'sawtooth', 0.06, 0.12) },
  ok: () => { tone(660, 0.1, 'square', 0.06); tone(990, 0.16, 'square', 0.06, 0.09) },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.06, i * 0.11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.15)),
  hint: () => tone(1500, 0.12, 'sine', 0.06),
}
