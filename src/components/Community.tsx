import { QRCodeSVG } from 'qrcode.react'

interface Channel { src: string; label: string; sub: string; url: string }

/** Canales principales: se muestran al final de cada juego. */
const MAIN: Channel[] = [
  { src: '/qr/instagram.webp', label: 'Instagram', sub: '@dsc.pucp', url: 'https://www.instagram.com/dsc.pucp/' },
  { src: '/qr/linkedin.webp', label: 'LinkedIn', sub: 'DSC - PUCP', url: 'https://www.linkedin.com/company/developer-student-club-pucp' },
  { src: '/qr/whatsapp.webp', label: 'WhatsApp', sub: 'Comunidad abierta', url: 'https://chat.whatsapp.com/COGPv61h53kFwNwWRurhaL' },
]

/** Resto de canales: solo en el panel completo de Comunidad. */
const MORE: Channel[] = [
  { src: '/qr/09_linktree.png', label: 'Linktree', sub: 'linktr.ee/dscpucp', url: 'https://linktr.ee/dscpucp' },
  { src: '/qr/06_web.png', label: 'Web', sub: 'dsc.inf.pucp.edu.pe', url: 'https://dsc.inf.pucp.edu.pe' },
  { src: '/qr/03_github.png', label: 'GitHub', sub: 'DSC-PUCP', url: 'https://github.com/DSC-PUCP' },
  { src: '/qr/04_youtube.png', label: 'YouTube', sub: '@dsc_pucp', url: 'https://www.youtube.com/@dsc_pucp/' },
  { src: '/qr/05_tiktok.png', label: 'TikTok', sub: '@dsc.pucp', url: 'https://www.tiktok.com/@dsc.pucp' },
  { src: '/qr/07_correo.png', label: 'Correo', sub: 'dsc.pucp@gmail.com', url: 'mailto:dsc.pucp@gmail.com' },
]

function Card({ c, small = false }: { c: Channel; small?: boolean }) {
  return (
    <a className="qr" href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <img src={c.src} alt={`QR ${c.label}`} style={small ? { width: 120, height: 120 } : undefined} />
      <div>{c.label}</div>
      <div className="muted" style={{ fontSize: 14 }}>{c.sub}</div>
    </a>
  )
}

export function Community({ compact = false }: { compact?: boolean }) {
  return (
    <div className="col" style={{ alignItems: 'center', gap: 12 }}>
      {!compact && <h3 style={{ fontSize: 30 }}>Únete a la comunidad DSC 💚</h3>}
      <div className="qr-grid">
        {MAIN.map((c) => <Card key={c.label} c={c} />)}
      </div>
      {!compact && (
        <>
          <h3 style={{ fontSize: 22, marginTop: 10 }}>Más de DSC</h3>
          <div className="qr-grid" style={{ gap: 14 }}>
            {MORE.map((c) => <Card key={c.label} c={c} small />)}
          </div>
        </>
      )}
    </div>
  )
}

export function QR({ value, label, large = false }: { value: string; label: string; large?: boolean }) {
  return (
    <div className={`qr ${large ? 'lg' : ''}`}>
      <QRCodeSVG value={value} fgColor="#2b2670" level="M" marginSize={1} />
      <div>{label}</div>
    </div>
  )
}
