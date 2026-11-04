import { useState } from 'react'
import { config } from '../lib/config'
import { STATEMENTS, type Statement } from '../data/truth'
import { shuffle, burst } from '../lib/fx'
import { sfx } from '../lib/sfx'
import { useCountdown } from '../lib/useCountdown'
import { TimerBar } from '../components/TimerBar'
import { Mascot } from '../components/Mascot'
import type { PrizeCtx } from '../lib/prize'
import { Dots, QuizResult } from './QuizShell'
import { emitBugle } from '../lib/bugle/bus'

const cfg = config.games.truth

export function TruthOrHallucination({ onPrize }: { onPrize: (c: PrizeCtx) => void }) {
  const [items, setItems] = useState<Statement[]>(() => shuffle(STATEMENTS).slice(0, cfg.rounds))
  const [i, setI] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [points, setPoints] = useState(0)
  const [answered, setAnswered] = useState<boolean | null | 'timeout'>(null)
  const [started, setStarted] = useState(false)
  const done = results.length >= items.length && answered === null
  const left = useCountdown(cfg.secondsPerStatement, started && !done && answered === null, () => answer('timeout'), i)
  const s = items[i]

  function answer(a: boolean | 'timeout') {
    if (answered !== null) return
    const ok = a === s.truth
    setAnswered(a)
    setResults((x) => [...x, ok])
    if (results.length + 1 === items.length) emitBugle({ type: 'quiz', juego: '¿Verdad o Alucinación?', correctas: results.filter(Boolean).length + (ok ? 1 : 0), total: items.length })
    if (ok) {
      setPoints((p) => p + 100 + Math.round(left * 5))
      sfx.ok()
      burst(true)
    } else sfx.error()
  }

  function next() {
    setAnswered(null)
    if (i + 1 < items.length) setI(i + 1)
  }

  function reset() {
    setItems(shuffle(STATEMENTS).slice(0, cfg.rounds))
    setI(0)
    setResults([])
    setPoints(0)
    setAnswered(null)
    setStarted(true)
  }

  if (!started) {
    return (
      <div className="center card pop" style={{ maxWidth: 860, margin: '0 auto' }}>
        <Mascot mood="think" size={130} className="bounce" />
        <h2 style={{ fontSize: 52 }}>¿Verdadero o Alucinación?</h2>
        <p style={{ margin: 0 }}>Afirmaciones técnicas que suenan muy convincentes… pero algunas son alucinaciones de IA. ¿Puedes distinguirlas?</p>
        <p style={{ margin: 0 }}>🎡 Ruleta con <b>{cfg.prizeMinCorrect}/{cfg.rounds}</b> correctas.</p>
        <button className="btn big sun" onClick={() => setStarted(true)}>¡Empezar! 🤖</button>
      </div>
    )
  }

  if (done) {
    const correct = results.filter(Boolean).length
    return (
      <QuizResult
        title={correct >= cfg.prizeMinCorrect ? '¡Hallucination Slayer! 🗡️' : 'La IA te engañó un poquito 🤖'}
        correct={correct}
        total={items.length}
        points={points}
        minCorrect={cfg.prizeMinCorrect}
        onAgain={reset}
        onPrize={() => onPrize({ game: 'truth', gameLabel: 'Verdadero o Alucinación', score: `${correct}/${items.length}` })}
      />
    )
  }

  const ok = answered !== null && answered === s.truth
  return (
    <div className="col" style={{ maxWidth: 1050, margin: '0 auto', width: '100%', gap: 22 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Dots results={results} total={items.length} current={i} />
        <span className="pill sun">{points} pts</span>
      </div>
      <TimerBar left={answered !== null ? 0 : left} total={cfg.secondsPerStatement} />
      <div className="card pop" key={i} style={{ padding: '40px 44px', minHeight: 220, display: 'flex', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 38, fontWeight: 800, lineHeight: 1.25 }}>“{s.text}”</p>
      </div>
      {answered === null ? (
        <div className="row" style={{ justifyContent: 'center', gap: 28 }}>
          <button className="btn big" style={{ fontSize: 34, minWidth: 340 }} onClick={() => answer(true)}>✅ Verdadero</button>
          <button className="btn big lilac" style={{ fontSize: 34, minWidth: 340 }} onClick={() => answer(false)}>🤖 Alucinación</button>
        </div>
      ) : (
        <div className="row pop" style={{ flexWrap: 'nowrap' }}>
          <Mascot mood={ok ? 'party' : 'sad'} size={110} />
          <div className="col grow" style={{ gap: 8 }}>
            <span className={`banner ${ok ? 'ok' : 'bad'}`} style={{ alignSelf: 'flex-start', fontSize: 38 }}>
              {answered === 'timeout' ? '⏰ ¡Tiempo!' : ok ? '¡Correcto!' : '¡Te la creíste!'} Era {s.truth ? 'VERDAD ✅' : 'ALUCINACIÓN 🤖'}
            </span>
            <span style={{ fontSize: 21 }}>{s.why}</span>
          </div>
          <button className="btn big sun" onClick={next} autoFocus>{i + 1 < items.length ? 'Siguiente ➜' : 'Resultado 🏁'}</button>
        </div>
      )}
    </div>
  )
}
