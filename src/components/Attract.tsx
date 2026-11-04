import { useEffect, useMemo, useState } from 'react'
import { PHOTOS, TIPOS, eventById, formatFecha } from '../lib/gallery'
import { shuffle } from '../lib/fx'
import { Mascot } from './Mascot'

/** Modo atracción: carrusel de fotos de la comunidad cuando nadie usa el stand. */
export function Attract({ slideSeconds, onExit }: { slideSeconds: number; onExit: () => void }) {
  const order = useMemo(() => shuffle(PHOTOS), [])
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % order.length), slideSeconds * 1000)
    const exit = () => onExit()
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', exit)
      window.addEventListener('keydown', exit)
      window.addEventListener('pointermove', exit)
    }, 800) // evita salir por el mismo movimiento residual
    return () => {
      clearInterval(id)
      clearTimeout(t)
      window.removeEventListener('pointerdown', exit)
      window.removeEventListener('keydown', exit)
      window.removeEventListener('pointermove', exit)
    }
  }, [order.length, slideSeconds, onExit])

  const p = order[i]
  const ev = eventById.get(p.eventId)
  return (
    <div className="attract">
      <img key={p.id + '-bg'} src={p.thumb} alt="" className="attract-bg" />
      <img key={p.id} src={p.src} alt="" className="attract-photo" style={{ ['--slide' as string]: `${slideSeconds}s` }} />
      <div className="attract-caption card pop" key={p.id + '-cap'}>
        <span className="pill" style={{ background: TIPOS[ev?.tipo ?? '']?.color ?? 'white' }}>
          {TIPOS[ev?.tipo ?? '']?.emoji ?? '📸'} {TIPOS[ev?.tipo ?? '']?.label ?? 'DSC'}
        </span>
        <h2 style={{ fontSize: 40 }}>{ev?.nombre}</h2>
        {ev?.fecha && <span className="muted">{formatFecha(ev.fecha)}{ev.lugar ? ` · ${ev.lugar}` : ''}</span>}
      </div>
      <div className="attract-cta">
        <Mascot mood="happy" size={110} className="bounce" />
        <div className="banner ok">¡Toca para jugar y ganar premios! 🎮</div>
      </div>
      <img src="/brand/logo.png" alt="DSC PUCP" className="attract-logo" />
    </div>
  )
}
