import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { config, type Segment } from '../lib/config'
import { BADGES, type PrizeCtx } from '../lib/prize'
import { QR } from '../components/Community'
import { Mascot } from '../components/Mascot'

export function Prize({ segment, ctx }: { segment: Segment; ctx: PrizeCtx }) {
  switch (segment.type) {
    case 'flores':
      return (
        <div className="center" style={{ gap: 14 }}>
          <div style={{ fontSize: 72 }} className="bounce">🌼</div>
          <h2 style={{ fontSize: 44 }}>¡Flores amarillas!</h2>
          <p style={{ margin: 0 }}>Escanea, crea tu plantilla ahora o más tarde y regálasela a quien quieras.</p>
          <QR value={config.links.flores} label="Crear mis flores" large />
          <div className="pill lilac" style={{ fontSize: 15, textAlign: 'left' }}>
            👩‍💻 Encargado: cuando tenga su URL, activa la plantilla con el UUID (procedimiento interno).
          </div>
        </div>
      )
    case 'insignia':
      return <BadgeMaker ctx={ctx} />
    case 'chocolate':
      return (
        <div className="center">
          <div style={{ fontSize: 90 }} className="bounce">🍫</div>
          <h2 style={{ fontSize: 48 }}>¡Chocolate!</h2>
          <p style={{ margin: 0 }}>Reclámalo con el encargado del stand. Combustible oficial de devs.</p>
        </div>
      )
    case 'sorpresa':
      return (
        <div className="center">
          <div style={{ fontSize: 90 }} className="wiggle">🎁</div>
          <h2 style={{ fontSize: 48 }}>¡Premio sorpresa!</h2>
          <p style={{ margin: 0 }}>El equipo DSC te lo entrega ahora mismo 👀</p>
        </div>
      )
    default:
      return (
        <div className="center">
          <div style={{ fontSize: 90 }} className="bounce">{segment.emoji}</div>
          <h2 style={{ fontSize: 48 }}>{segment.label}</h2>
          <p style={{ margin: 0 }}>Reclámalo con el encargado del stand.</p>
        </div>
      )
  }
}

export function BadgeMaker({ ctx }: { ctx: PrizeCtx }) {
  const titles = [...(ctx.game ? BADGES[ctx.game] : []), ...BADGES.any.filter((b) => !(ctx.game && BADGES[ctx.game].includes(b)))]
  const [name, setName] = useState(ctx.player ?? '')
  const [title, setTitle] = useState(titles[0])
  const [saved, setSaved] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function download() {
    if (!ref.current) return
    const url = await toPng(ref.current, { pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = url
    a.download = `insignia-dsc-${(name || 'dev').toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
    setSaved(true)
  }

  const date = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="col" style={{ gap: 14 }}>
      <h2 style={{ fontSize: 36 }}>🏅 ¡Ganaste una insignia!</h2>
      <div className="row" style={{ gap: 10 }}>
        <input className="input grow" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input" value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: 18 }}>
          {titles.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div
        ref={ref}
        style={{
          background: 'linear-gradient(135deg, #e9f9e7 0%, #ffffff 55%, #fff6cf 100%)',
          border: '4px solid #2b2670',
          borderRadius: 24,
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'absolute', right: -30, top: -40, width: 40, height: 260, background: '#7be36f', transform: 'rotate(22deg)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', right: 30, top: -40, width: 14, height: 260, background: '#64c462', transform: 'rotate(22deg)', opacity: 0.6 }} />
        <Mascot mood="party" size={120} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', color: '#3f3797' }}>DSC Arcade · Insignia oficial</div>
          <div style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 40, lineHeight: 1, margin: '6px 0', color: '#2b2670' }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{name || 'Tu nombre'}</div>
          <div style={{ fontSize: 15, opacity: 0.75, marginTop: 4 }}>
            {ctx.gameLabel ? `${ctx.gameLabel}${ctx.score ? ` · ${ctx.score}` : ''} · ` : ''}
            {date}
          </div>
        </div>
        <img src="/brand/logo.png" alt="" style={{ width: 84, marginLeft: 'auto', position: 'relative' }} />
      </div>

      <button className="btn" onClick={download}>⬇️ Descargar PNG</button>
      <div className={`pill ${saved ? 'sun' : 'lilac'}`} style={{ fontSize: 16 }}>
        📧 Encargado: {saved ? 'insignia descargada. ¡Envíala ahora a su correo!' : 'descarga la insignia y envíala al correo del participante.'}
      </div>
    </div>
  )
}
