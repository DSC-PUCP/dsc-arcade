export function TimerBar({ left, total }: { left: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (left / total) * 100))
  const cls = pct < 25 ? 'danger' : pct < 50 ? 'warn' : ''
  return (
    <div className={`timer ${cls}`}>
      <div style={{ width: `${pct}%` }} />
      <span>{left.toFixed(1)} s</span>
    </div>
  )
}
