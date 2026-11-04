import { useState } from 'react'
import { config } from '../lib/config'
import { LOGOS, type Logo } from '../data/logos'
import { shuffle, burst } from '../lib/fx'
import { sfx } from '../lib/sfx'
import { useCountdown } from '../lib/useCountdown'
import { TimerBar } from '../components/TimerBar'
import { Mascot } from '../components/Mascot'
import type { PrizeCtx } from '../lib/prize'
import { Dots, QuizResult } from './QuizShell'
import { emitBugle } from '../lib/bugle/bus'

const cfg = config.games.logos

interface Round { logo: Logo; options: string[] }

function makeRounds(): Round[] {
  return shuffle(LOGOS).slice(0, cfg.rounds).map((logo) => ({
    logo,
    options: shuffle([logo.name, ...shuffle(LOGOS.filter((l) => l.name !== logo.name)).slice(0, 3).map((l) => l.name)]),
  }))
}

export function LogoGuess({ onPrize }: { onPrize: (c: PrizeCtx) => void }) {
  const [rounds, setRounds] = useState<Round[]>(makeRounds)
  const [i, setI] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [points, setPoints] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const done = results.length >= rounds.length && picked === null
  const playing = started && !done && picked === null

  const left = useCountdown(cfg.secondsPerLogo, playing, () => answer(''), i)
  const r = rounds[i]
  const progress = 1 - left / cfg.secondsPerLogo // 0 → 1 reveal

  function answer(name: string) {
    if (picked !== null) return
    const ok = name === r.logo.name
    setPicked(name)
    setResults((x) => [...x, ok])
    if (results.length + 1 === rounds.length) emitBugle({ type: 'quiz', juego: 'Adivina el Logo', correctas: results.filter(Boolean).length + (ok ? 1 : 0), total: rounds.length })
    if (ok) {
      setPoints((p) => p + 100 + Math.round(left * 10))
      sfx.ok()
      burst(true)
    } else sfx.error()
  }

  function next() {
    setPicked(null)
    if (i + 1 < rounds.length) setI(i + 1)
  }

  function reset() {
    setRounds(makeRounds())
    setI(0)
    setResults([])
    setPoints(0)
    setPicked(null)
    setStarted(true)
  }

  if (!started) {
    return (
      <div className="center card pop" style={{ maxWidth: 820, margin: '0 auto' }}>
        <Mascot mood="detective" size={150} className="bounce" />
        <h2 style={{ fontSize: 52 }}>Adivina el Logo Tech</h2>
        <p style={{ margin: 0 }}>{cfg.rounds} logos de la era IA y del stack moderno. Se van revelando poco a poco: ¡mientras antes aciertes, más puntos!</p>
        <p style={{ margin: 0 }}>🎡 Ruleta con <b>{cfg.prizeMinCorrect}/{cfg.rounds}</b> correctas.</p>
        <button className="btn big sun" onClick={() => setStarted(true)}>¡Empezar! 🔍</button>
      </div>
    )
  }

  if (done) {
    const correct = results.filter(Boolean).length
    return (
      <QuizResult
        title={correct >= cfg.prizeMinCorrect ? '¡Radar tech activado! 📡' : 'Casi, casi 👀'}
        correct={correct}
        total={rounds.length}
        points={points}
        minCorrect={cfg.prizeMinCorrect}
        onAgain={reset}
        onPrize={() => onPrize({ game: 'logos', gameLabel: 'Adivina el Logo', score: `${correct}/${rounds.length}` })}
      />
    )
  }

  const reveal = picked !== null ? 1 : progress
  const blur = (1 - reveal) * 22
  const scale = 1 + (1 - reveal) * 2.2
  return (
    <div className="row" style={{ gap: 40, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <div className="col" style={{ alignItems: 'center' }}>
        <Dots results={results} total={rounds.length} current={i} />
        <div className="card" style={{ width: 380, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, background: picked !== null ? `#${r.logo.hex}22` : 'white' }}>
          <svg viewBox="0 0 24 24" width="220" height="220" style={{ filter: `blur(${blur}px)`, transform: `scale(${scale}) rotate(${(1 - reveal) * 25}deg)`, transition: picked ? 'all .4s' : 'none' }}>
            <path d={r.logo.path} fill={picked !== null ? `#${r.logo.hex}` : 'var(--ink)'} />
          </svg>
        </div>
        <div style={{ width: 380 }}><TimerBar left={picked !== null ? 0 : left} total={cfg.secondsPerLogo} /></div>
      </div>
      <div className="col" style={{ minWidth: 420 }}>
        <h2 style={{ fontSize: 40 }}>¿Qué tecnología es?</h2>
        {r.options.map((o) => {
          const isAns = o === r.logo.name
          const bg = picked === null ? 'white' : isAns ? 'var(--lime)' : o === picked ? 'var(--coral)' : 'white'
          return (
            <button key={o} className={`btn ${picked === o && !isAns ? 'shake' : ''}`} style={{ background: bg, justifyContent: 'flex-start', fontSize: 26 }} onClick={() => answer(o)} disabled={picked !== null && !isAns && o !== picked}>
              {o}
            </button>
          )
        })}
        {picked !== null && (
          <button className="btn big sun pop" onClick={next} autoFocus>
            {i + 1 < rounds.length ? 'Siguiente ➜' : 'Ver resultado 🏁'}
          </button>
        )}
      </div>
    </div>
  )
}
