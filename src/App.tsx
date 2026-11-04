import { useEffect, useState } from 'react'
import { config, type GameId } from './lib/config'
import type { PrizeCtx } from './lib/prize'
import { isMuted, setMuted, sfx } from './lib/sfx'
import { Mascot } from './components/Mascot'
import { Community } from './components/Community'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Ruleta } from './games/Ruleta'
import { DebugChallenge } from './games/DebugChallenge'
import { Speedrun } from './games/Speedrun'
import { LogoGuess } from './games/LogoGuess'
import { TruthOrHallucination } from './games/TruthOrHallucination'

type Screen = 'hub' | 'ruleta' | GameId

const GAMES: { id: GameId; emoji: string; title: string; desc: string; tag: string; color: string }[] = [
  { id: 'debug', emoji: '🐛', title: 'Debug Challenge', desc: 'En fila india: encuentra el bug en 15 s o quedas fuera.', tag: 'Grupal', color: 'var(--lime)' },
  { id: 'speedrun', emoji: '⌨️', title: 'Tech Speedrun', desc: 'Escribe código absurdo lo más rápido que puedas.', tag: 'Ranking', color: 'var(--sun)' },
  { id: 'logos', emoji: '🧩', title: 'Adivina el Logo', desc: 'Logos de la era IA que se revelan poco a poco.', tag: '1 min', color: 'var(--lilac)' },
  { id: 'truth', emoji: '🤖', title: '¿Verdad o Alucinación?', desc: 'Datos técnicos convincentes… ¿o inventados por una IA?', tag: '1 min', color: '#9fd8ff' },
]

const TAGLINES = ['¿Puedes encontrar el bug en 15 segundos? 🐛', '¿Escribes código más rápido que un compilador? ⌨️', '¿Distingues una verdad de una alucinación de IA? 🤖', 'Juega, gana premios y únete a la comunidad 💚']

export default function App() {
  const [screen, setScreen] = useState<Screen>('hub')
  const [prizeCtx, setPrizeCtx] = useState<PrizeCtx>({})
  const [showQR, setShowQR] = useState(false)
  const [muted, setM] = useState(isMuted())
  const [tag, setTag] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTag((t) => (t + 1) % TAGLINES.length), 3500)
    return () => clearInterval(id)
  }, [])

  const go = (s: Screen) => {
    sfx.click()
    setScreen(s)
    window.scrollTo(0, 0)
  }
  const toPrize = (c: PrizeCtx) => {
    setPrizeCtx(c)
    go('ruleta')
  }
  const enabled = GAMES.filter((g) => config.games[g.id].enabled)

  return (
    <div className="app">
      <div className="slashes"><span /><span /><span /></div>
      <header className="topbar">
        <img src="/brand/logo.png" alt="DSC PUCP" onClick={() => go('hub')} />
        <span className="title">DSC Arcade</span>
        {screen !== 'hub' && <button className="btn white sm" onClick={() => go('hub')}>← Menú</button>}
        <span className="spacer" />
        <button className="btn sun sm" onClick={() => { setPrizeCtx({}); go('ruleta') }}>🎡 Ruleta</button>
        <button className="btn white sm" onClick={() => setShowQR(true)}>📱 Comunidad</button>
        <button className="icon-btn" title={muted ? 'Activar sonido' : 'Silenciar'} onClick={() => { setMuted(!muted); setM(!muted) }}>{muted ? '🔇' : '🔊'}</button>
      </header>

      <main className="main" key={screen}>
        <ErrorBoundary onReset={() => setScreen('hub')}>
        {screen === 'hub' && (
          <>
            <section className="hero">
              <div>
                <h1>
                  Juega, aprende y <span className="hl">gana</span> 🎉
                </h1>
                <div className="rot pop" key={tag}>{TAGLINES[tag]}</div>
                <p style={{ fontSize: 20, margin: '8px 0 0', maxWidth: 560 }}>
                  Somos <b>Developer Student Club PUCP</b>: aprendemos tecnología construyendo proyectos reales, talleres y hackathons. ¡Este arcade también lo hicimos nosotros!
                </p>
              </div>
              <div className="center" style={{ position: 'relative' }}>
                <Mascot size={260} className="bounce" />
                <div className="card" style={{ position: 'absolute', top: 6, right: 20, padding: '10px 16px', transform: 'rotate(4deg)', fontWeight: 800 }}>¡Hola! Soy Bugle 🐧</div>
              </div>
            </section>
            <section className="games">
              {enabled.map((g) => (
                <button key={g.id} className="card game-card pop" style={{ background: g.color }} onClick={() => go(g.id)}>
                  <span className="pill tag">{g.tag}</span>
                  <span className="emoji">{g.emoji}</span>
                  <h3>{g.title}</h3>
                  <p>{g.desc}</p>
                </button>
              ))}
            </section>
          </>
        )}
        {screen === 'ruleta' && <Ruleta ctx={prizeCtx} />}
        {screen === 'debug' && <DebugChallenge onPrize={toPrize} />}
        {screen === 'speedrun' && <Speedrun onPrize={toPrize} />}
        {screen === 'logos' && <LogoGuess onPrize={toPrize} />}
        {screen === 'truth' && <TruthOrHallucination onPrize={toPrize} />}
        </ErrorBoundary>
      </main>

      {showQR && (
        <div className="overlay" onClick={() => setShowQR(false)}>
          <div className="card modal pop center" onClick={(e) => e.stopPropagation()}>
            <Community />
            <button className="btn" onClick={() => setShowQR(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
