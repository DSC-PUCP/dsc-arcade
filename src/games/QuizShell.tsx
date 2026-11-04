import type { ReactNode } from 'react'
import { Mascot } from '../components/Mascot'

/** Pantalla final compartida por los juegos de preguntas. */
export function QuizResult(props: {
  title: string
  correct: number
  total: number
  points: number
  minCorrect: number
  onPrize: () => void
  onAgain: () => void
  extra?: ReactNode
}) {
  const prize = props.correct >= props.minCorrect
  return (
    <div className="center card pop grow" style={{ maxWidth: 820, margin: '0 auto' }}>
      <Mascot mood={prize ? 'party' : props.correct >= props.total / 2 ? 'happy' : 'sad'} size={140} className="bounce" />
      <h2 style={{ fontSize: 56 }}>{props.title}</h2>
      <div className="row" style={{ justifyContent: 'center' }}>
        <span className="pill lime" style={{ fontSize: 28 }}>{props.correct}/{props.total} correctas</span>
        <span className="pill sun" style={{ fontSize: 28 }}>{props.points} pts</span>
      </div>
      {props.extra}
      <div className="row" style={{ justifyContent: 'center' }}>
        {prize && <button className="btn big sun" onClick={props.onPrize}>🎡 Girar la ruleta</button>}
        <button className="btn white" onClick={props.onAgain}>Jugar otra vez</button>
      </div>
      {!prize && <span className="muted">Necesitas {props.minCorrect}/{props.total} para girar la ruleta. ¡Inténtalo de nuevo!</span>}
    </div>
  )
}

export function Dots({ results, total, current }: { results: boolean[]; total: number; current: number }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: 22, height: 22, borderRadius: '50%', border: 'var(--border)',
            background: i < results.length ? (results[i] ? 'var(--lime)' : 'var(--coral)') : i === current ? 'var(--sun)' : 'white',
            transform: i === current ? 'scale(1.25)' : undefined, transition: 'transform .2s',
          }}
        />
      ))}
    </div>
  )
}
