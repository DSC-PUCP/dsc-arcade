import { useEffect, useRef, useState } from 'react'

/** Countdown in seconds. Restarts whenever `key` changes while running. */
export function useCountdown(seconds: number, running: boolean, onEnd: () => void, key: unknown = 0) {
  const [left, setLeft] = useState(seconds)
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    if (!running) return
    const start = performance.now()
    setLeft(seconds)
    let fired = false
    const id = setInterval(() => {
      const l = Math.max(0, seconds - (performance.now() - start) / 1000)
      setLeft(l)
      if (l <= 0 && !fired) {
        fired = true
        clearInterval(id)
        endRef.current()
      }
    }, 100)
    return () => clearInterval(id)
  }, [seconds, running, key])
  return left
}
