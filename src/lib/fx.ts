import confetti from 'canvas-confetti'

const colors = ['#64c462', '#7be36f', '#ffd23f', '#3f3797', '#b9b3ff', '#ff6b6b']

export function burst(small = false) {
  confetti({ particleCount: small ? 60 : 160, spread: small ? 60 : 100, origin: { y: 0.6 }, colors, scalar: small ? 0.9 : 1.2 })
}

export function party() {
  const end = Date.now() + 1500
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
