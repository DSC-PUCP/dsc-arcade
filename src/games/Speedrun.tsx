import { useCallback, useEffect, useRef, useState } from 'react'
import { config } from '../lib/config'
import { SPEED_TEXTS, type SpeedText } from '../data/speedrunTexts'
import { useStored } from '../lib/storage'
import { sfx } from '../lib/sfx'
import { burst, party } from '../lib/fx'
import { Mascot } from '../components/Mascot'
import type { PrizeCtx } from '../lib/prize'
import { emitBugle } from '../lib/bugle/bus'

const cfg = config.games.speedrun

interface Entry { id: string; name: string; wpm: number; acc: number; score: number; text: string; at: number }
type Phase = 'pick' | 'play' | 'done'

function skipIndent(text: string, pos: number) {
  if (text[pos - 1] !== '\n') return pos
  while (text[pos] === ' ') pos++
  return pos
}

export function Speedrun({ onPrize }: { onPrize: (c: PrizeCtx) => void }) {
  const [textChoice, setTextChoice] = useStored<string>('speed-text', 'random')
  const [board, setBoard] = useStored<Entry[]>('speed-board', [])
  const [phase, setPhase] = useState<Phase>('pick')
  const [text, setText] = useState<SpeedText>(SPEED_TEXTS[0])
  const [pos, setPos] = useState(0)
  const [errors, setErrors] = useState(0)
  const [flash, setFlash] = useState(false)
  const [t0, setT0] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [result, setResult] = useState<{ wpm: number; acc: number; score: number; secs: number } | null>(null)
  const [name, setName] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  const code = text.code

  function begin() {
    const t = textChoice === 'random' ? SPEED_TEXTS[Math.floor(Math.random() * SPEED_TEXTS.length)] : SPEED_TEXTS.find((x) => x.id === textChoice) ?? SPEED_TEXTS[0]
    setText(t)
    setPos(0)
    setErrors(0)
    setT0(null)
    setResult(null)
    setName('')
    setSavedId(null)
    setPhase('play')
  }

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== 'play') return
      if (e.key === 'Escape') return setPhase('pick')
      let k = e.key
      if (k === 'Enter') k = '\n'
      if (k === 'Tab') e.preventDefault()
      if (k.length !== 1 && k !== '\n') return
      e.preventDefault()
      const start = t0 ?? performance.now()
      if (t0 === null) setT0(start)
      if (k === code[pos]) {
        sfx.key()
        const np = skipIndent(code, pos + 1)
        setPos(np)
        if (np >= code.length) {
          const secs = (performance.now() - start) / 1000
          const wpm = Math.round((code.length / 5) / (secs / 60))
          const acc = Math.round((code.length / (code.length + errors)) * 100)
          setResult({ wpm, acc, score: Math.round((wpm * acc) / 100), secs })
          setPhase('done')
          sfx.win()
          emitBugle({ type: 'speedrun', wpm, precision: acc, texto: text.title, premio: wpm >= cfg.prizeMinWpm && acc >= cfg.prizeMinAccuracy })
          if (wpm >= cfg.prizeMinWpm && acc >= cfg.prizeMinAccuracy) party()
          else burst(true)
        }
      } else {
        setErrors((x) => x + 1)
        setFlash(true)
        sfx.error()
        setTimeout(() => setFlash(false), 180)
      }
    },
    [phase, code, pos, t0, errors],
  )

  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKey])

  useEffect(() => {
    if (phase !== 'play' || t0 === null) return
    const id = setInterval(() => setNow(performance.now()), 200)
    return () => clearInterval(id)
  }, [phase, t0])

  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [pos])

  const secs = t0 ? Math.max(0.1, (now - t0) / 1000) : 0
  const liveWpm = t0 && secs > 1 ? Math.round((pos / 5) / (secs / 60)) : 0
  const sorted = [...board].sort((a, b) => b.score - a.score)

  function saveScore() {
    if (!result || !name.trim()) return
    const e: Entry = { id: crypto.randomUUID(), name: name.trim(), ...result, text: text.title, at: Date.now() }
    const prev = [...board].sort((a, b) => b.score - a.score)[0]
    const next = [...board, e]
    setBoard(next)
    if (!prev || e.score > prev.score) emitBugle({ type: 'record', jugador: e.name, wpm: e.wpm, precision: e.acc, anterior: prev && { jugador: prev.name, wpm: prev.wpm } })
    else emitBugle({ type: 'speedrun_guardado', jugador: e.name, wpm: e.wpm, puesto: next.filter((x) => x.score > e.score).length + 1, total: next.length })
    setSavedId(e.id)
    sfx.ok()
  }

  const Board = (
    <div className="card col" style={{ width: 380, flexShrink: 0, gap: 12, padding: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 28 }}>🏆 Ranking de hoy</h3>
        {board.length > 0 && (
          <button className="btn white sm" onClick={() => confirm('¿Borrar el ranking de esta sesión?') && setBoard([])}>Reiniciar</button>
        )}
      </div>
      <ol className="board">
        {sorted.slice(0, 8).map((e, i) => (
          <li key={e.id} className={e.id === savedId ? 'me' : ''}>
            <span className="pos">{i + 1}</span>
            <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
            <span>{e.score} pts</span>
          </li>
        ))}
        {!board.length && <span className="muted">Aún nadie. ¡Sé el primero!</span>}
      </ol>
      <span className="muted" style={{ fontSize: 15 }}>Puntaje = WPM × precisión. Solo se guarda en esta laptop.</span>
    </div>
  )

  if (phase === 'pick') {
    return (
      <div className="row" style={{ alignItems: 'flex-start', gap: 32, flexWrap: 'nowrap' }}>
        <div className="card col grow">
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <h2 style={{ fontSize: 44 }} className="grow">⌨️ Tech Speedrun</h2>
            <Mascot mood="typing" size={120} className="bounce" />
          </div>
          <p style={{ margin: 0 }}>
            Escribe el código lo más rápido que puedas. Si te equivocas, no avanza hasta que pongas la tecla correcta. La indentación se salta sola 😉
          </p>
          <p style={{ margin: 0 }}>
            🎡 Premio: <b>{cfg.prizeMinWpm}+ WPM</b> con <b>{cfg.prizeMinAccuracy}%+</b> de precisión.
          </p>
          <label className="col" style={{ gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 17 }}>Texto (lo elige el encargado)</span>
            <select className="input" value={textChoice} onChange={(e) => setTextChoice(e.target.value)}>
              <option value="random">🎲 Aleatorio</option>
              {SPEED_TEXTS.map((t) => (
                <option key={t.id} value={t.id}>{t.title} · {t.lang}</option>
              ))}
            </select>
          </label>
          <button className="btn big sun" onClick={begin} style={{ alignSelf: 'flex-start' }}>¡Empezar! ⚡</button>
        </div>
        {Board}
      </div>
    )
  }

  if (phase === 'done' && result) {
    const prize = result.wpm >= cfg.prizeMinWpm && result.acc >= cfg.prizeMinAccuracy
    return (
      <div className="row" style={{ alignItems: 'flex-start', gap: 32, flexWrap: 'nowrap' }}>
        <div className="card center grow pop">
          <Mascot mood={prize ? 'party' : 'happy'} size={130} className="bounce" />
          <h2 style={{ fontSize: 52 }}>{prize ? '¡Teclado en llamas! 🔥' : '¡Compiló, mano!'}</h2>
          <div className="row" style={{ justifyContent: 'center' }}>
            <span className="pill lime" style={{ fontSize: 26 }}>{result.wpm} WPM</span>
            <span className="pill lilac" style={{ fontSize: 26 }}>{result.acc}% precisión</span>
            <span className="pill sun" style={{ fontSize: 26 }}>{result.secs.toFixed(1)} s</span>
          </div>
          {!savedId ? (
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input className="input" placeholder="Tu nombre para el ranking" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveScore()} autoFocus />
              <button className="btn" onClick={saveScore} disabled={!name.trim()}>Guardar</button>
            </div>
          ) : (
            <span className="pill lime">✅ ¡Guardado en el ranking!</span>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            {prize && (
              <button className="btn big sun" onClick={() => onPrize({ game: 'speedrun', gameLabel: 'Tech Speedrun', player: name.trim() || undefined, score: `${result.wpm} WPM` })}>
                🎡 Girar la ruleta
              </button>
            )}
            <button className="btn white" onClick={begin}>Otra vez</button>
            <button className="btn white" onClick={() => setPhase('pick')}>Cambiar texto</button>
          </div>
          {!prize && <span className="muted">Para la ruleta: {cfg.prizeMinWpm}+ WPM y {cfg.prizeMinAccuracy}%+ de precisión. ¡Ya casi la tienes!</span>}
        </div>
        {Board}
      </div>
    )
  }

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="row">
        <h2 style={{ fontSize: 36 }}>{text.title}</h2>
        <span className="pill lilac">{text.lang}</span>
        <span className="grow" />
        <span className="pill lime" style={{ fontSize: 24 }}>{liveWpm} WPM</span>
        <span className="pill coral" style={{ fontSize: 24 }}>{errors} errores</span>
        <span className="pill sun" style={{ fontSize: 24 }}>{secs.toFixed(1)} s</span>
      </div>
      <div className="timer"><div style={{ width: `${(pos / code.length) * 100}%` }} /><span>{Math.round((pos / code.length) * 100)}%</span></div>
      <div className={`code ${flash ? 'shake' : ''}`} style={{ padding: '22px 28px', fontSize: 30, lineHeight: 1.55, maxHeight: '58vh', overflow: 'auto', borderColor: flash ? 'var(--coral)' : undefined }}>
        <pre style={{ margin: 0, font: 'inherit', whiteSpace: 'pre-wrap' }}>
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>{code.slice(0, pos)}</span>
          <span ref={cursorRef} style={{ background: flash ? 'var(--coral)' : 'var(--sun)', borderRadius: 4, outline: '2px solid var(--ink)' }}>
            {code[pos] === '\n' ? '↵\n' : code[pos]}
          </span>
          <span style={{ opacity: 0.45 }}>{code.slice(pos + 1)}</span>
        </pre>
      </div>
      <div className="row muted" style={{ fontSize: 17 }}>
        {t0 === null ? '👉 Empieza a escribir cuando quieras: el tiempo corre con la primera tecla.' : 'Enter = salto de línea · Esc = salir'}
      </div>
    </div>
  )
}
