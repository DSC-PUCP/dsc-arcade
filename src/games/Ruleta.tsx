import { useMemo, useRef, useState } from 'react'
import { config, type Segment, type SegmentType } from '../lib/config'
import { useStored } from '../lib/storage'
import { sfx } from '../lib/sfx'
import { burst } from '../lib/fx'
import type { PrizeCtx } from '../lib/prize'
import { Prize } from './Prize'
import { Community } from '../components/Community'
import { emitBugle } from '../lib/bugle/bus'

const COLORS = ['#7be36f', '#ffd23f', '#b9b3ff', '#ffffff', '#64c462', '#ff9f9f', '#9fd8ff']
const TYPES: SegmentType[] = ['flores', 'insignia', 'otra', 'sorpresa', 'chocolate', 'custom']
const SPIN_MS = 5200

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`
}

export function Ruleta({ ctx }: { ctx: PrizeCtx }) {
  const [segments, setSegments] = useStored<Segment[]>('wheel', config.wheel.segments)
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Segment | null>(null)
  const [editing, setEditing] = useState(false)
  const tickRef = useRef<number | null>(null)

  const slices = useMemo(() => {
    const active = segments.filter((s) => s.weight > 0)
    const total = active.reduce((a, s) => a + s.weight, 0) || 1
    let acc = 0
    return active.map((s, i) => {
      const a0 = (acc / total) * Math.PI * 2
      acc += s.weight
      const a1 = (acc / total) * Math.PI * 2
      return { s, a0, a1, color: COLORS[i % COLORS.length] }
    })
  }, [segments])

  function spin() {
    if (spinning || !slices.length) return
    setResult(null)
    const total = slices.reduce((a, sl) => a + sl.s.weight, 0)
    let r = Math.random() * total
    const pick = slices.find((sl) => (r -= sl.s.weight) < 0) ?? slices[slices.length - 1]
    const span = pick.a1 - pick.a0
    const targetDeg = ((pick.a0 + span * (0.2 + Math.random() * 0.6)) * 180) / Math.PI
    const base = rot - (rot % 360)
    setRot(base + 360 * 6 + (360 - targetDeg))
    setSpinning(true)
    let delay = 40
    const tick = () => {
      sfx.tick()
      delay *= 1.09
      if (delay < 600) tickRef.current = window.setTimeout(tick, delay)
    }
    tick()
    window.setTimeout(() => {
      if (tickRef.current) clearTimeout(tickRef.current)
      setSpinning(false)
      setResult(pick.s)
      emitBugle({ type: 'ruleta', premio: pick.s.label })
      if (pick.s.type === 'otra') sfx.ok()
      else {
        sfx.win()
        burst()
      }
    }, SPIN_MS)
  }

  const R = 230
  const C = R + 10
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 40, justifyContent: 'center' }}>
      <div className="center" style={{ gap: 18 }}>
        {ctx.player && (
          <div className="pill sun">
            🎉 {ctx.player} ganó un giro{ctx.gameLabel ? ` en ${ctx.gameLabel}` : ''}
          </div>
        )}
        <div style={{ position: 'relative', width: C * 2, height: C * 2 + 20 }}>
          <svg width="56" height="64" viewBox="0 0 56 64" style={{ position: 'absolute', left: '50%', top: -6, transform: 'translateX(-50%)', zIndex: 2 }}>
            <path d="M6 4 H50 L28 58 Z" fill="#ff6b6b" stroke="#2b2670" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <svg width={C * 2} height={C * 2} viewBox={`0 0 ${C * 2 + 8} ${C * 2 + 8}`} style={{ marginTop: 20 }}>
            <circle cx={C + 6} cy={C + 6} r={R + 2} fill="#2b2670" />
            <g
              style={{
                transform: `rotate(${rot}deg)`,
                transformOrigin: `${C}px ${C}px`,
                transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(.12,.75,.12,1)` : 'none',
              }}
            >
              {slices.map(({ s, a0, a1, color }) => {
                const deg = (((a0 + a1) / 2) * 180) / Math.PI
                return (
                  <g key={s.id}>
                    <path d={arcPath(C, C, R, a0, a1)} fill={color} stroke="#2b2670" strokeWidth="4" />
                    <g transform={`rotate(${deg} ${C} ${C})`}>
                      <text x={C} y={C - R * 0.76} textAnchor="middle" fontSize="40">{s.emoji}</text>
                      <text x={C} y={C - R * 0.58} textAnchor="middle" fontSize={s.label.length > 12 ? 16 : 19} fontWeight="800" fill="#2b2670" fontFamily="Nunito Variable">
                        {s.label}
                      </text>
                    </g>
                  </g>
                )
              })}
            </g>
            <circle cx={C} cy={C} r={46} fill="#ffffff" stroke="#2b2670" strokeWidth="4" />
            <image href="/brand/logo.png" x={C - 42} y={C - 42} width="84" height="84" />
          </svg>
        </div>
        <div className="row">
          <button className="btn big sun" onClick={spin} disabled={spinning}>
            {spinning ? 'Girando y farmeando aura…' : '¡GIRAR!'}
          </button>
          <button className="icon-btn" title="Editar ruleta" onClick={() => setEditing(true)} disabled={spinning}>
            ⚙️
          </button>
        </div>
      </div>

      {result && (
        <div className="card pop" style={{ maxWidth: 600, flex: 1 }}>
          {result.type === 'otra' ? (
            <div className="center">
              <div style={{ fontSize: 80 }} className="wiggle">🔁</div>
              <h2 style={{ fontSize: 48 }}>¡Gira otra vez!</h2>
              <button className="btn big" onClick={spin}>Girar de nuevo</button>
            </div>
          ) : (
            <Prize segment={result} ctx={ctx} />
          )}
          <hr style={{ border: 0, borderTop: '3px dashed var(--ink)', margin: '20px 0 14px', opacity: 0.3 }} />
          <div className="center" style={{ gap: 8 }}>
            <b>¿Te gustó? Únete a DSC 💚</b>
            <Community compact />
          </div>
        </div>
      )}

      {editing && <WheelEditor segments={segments} onChange={setSegments} onClose={() => setEditing(false)} />}
    </div>
  )
}

function WheelEditor({ segments, onChange, onClose }: { segments: Segment[]; onChange: (s: Segment[]) => void; onClose: () => void }) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.weight), 0) || 1
  const upd = (i: number, patch: Partial<Segment>) => onChange(segments.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="card modal pop" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 36 }}>⚙️ Editar ruleta</h2>
          <button className="btn white sm" onClick={onClose}>Listo ✓</button>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 17 }}>
          El peso define la probabilidad (peso 0 = oculto). El tipo decide qué pantalla de premio se muestra. Los cambios se guardan en esta laptop.
        </p>
        <div className="col" style={{ gap: 10 }}>
          {segments.map((s, i) => (
            <div key={s.id} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <input className="input" style={{ width: 64, textAlign: 'center' }} value={s.emoji} onChange={(e) => upd(i, { emoji: e.target.value })} />
              <input className="input grow" style={{ minWidth: 0 }} value={s.label} onChange={(e) => upd(i, { label: e.target.value })} />
              <select className="input" value={s.type} onChange={(e) => upd(i, { type: e.target.value as SegmentType })} style={{ fontSize: 17 }}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <input className="input" type="number" min={0} style={{ width: 80 }} value={s.weight} onChange={(e) => upd(i, { weight: Math.max(0, Number(e.target.value)) })} />
              <span style={{ width: 52, fontWeight: 800, fontSize: 16 }}>{Math.round((Math.max(0, s.weight) / total) * 100)}%</span>
              <button className="btn coral sm" onClick={() => onChange(segments.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn sm" onClick={() => onChange([...segments, { id: crypto.randomUUID(), label: 'Nuevo premio', emoji: '⭐', weight: 1, type: 'custom' }])}>
            + Agregar
          </button>
          <button className="btn white sm" onClick={() => onChange(config.wheel.segments)}>Restaurar por defecto</button>
        </div>
      </div>
    </div>
  )
}
