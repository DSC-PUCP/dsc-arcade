import { useEffect, useMemo, useRef, useState } from 'react'
import { config } from '../lib/config'
import { SNIPPETS, parseSnippet, type ParsedSnippet } from '../data/debugSnippets'
import { CodeView } from '../components/CodeView'
import { TimerBar } from '../components/TimerBar'
import { Mascot } from '../components/Mascot'
import { useCountdown } from '../lib/useCountdown'
import { useStored } from '../lib/storage'
import { sfx } from '../lib/sfx'
import { burst, party, shuffle } from '../lib/fx'
import type { PrizeCtx } from '../lib/prize'
import { emitBugle } from '../lib/bugle/bus'

const cfg = config.games.debug
const PARSED = SNIPPETS.map(parseSnippet)
const LEVEL_NAME = { 1: 'Muy fácil', 2: 'Fácil', 3: 'Medio' } as const

interface Player { name: string; alive: boolean; hints: number; time: number; hits: number }
type Phase = 'setup' | 'ready' | 'play' | 'reveal' | 'roundEnd' | 'winner'
type Outcome = 'ok' | 'wrong' | 'timeout'

export function DebugChallenge({ onPrize }: { onPrize: (c: PrizeCtx) => void }) {
  const [names, setNames] = useStored<string[]>('debug-names', [])
  const [draft, setDraft] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [phase, setPhase] = useState<Phase>('setup')
  const [round, setRound] = useState(1)
  const [queue, setQueue] = useState<string[]>([])
  const [turn, setTurn] = useState(0)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [snippet, setSnippet] = useState<ParsedSnippet | null>(null)
  const [marks, setMarks] = useState<Record<number, 'hint' | 'correct' | 'wrong' | 'answer'>>({})
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [eliminated, setEliminated] = useState<string[]>([])
  const [winner, setWinner] = useState<Player | null>(null)
  const [hintUsed, setHintUsed] = useState(false)
  const startedAt = useRef(0)
  const turnStart = useRef(0)
  const used = useRef(new Set<string>())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (phase === 'setup' || phase === 'winner') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])

  const elapsed = startedAt.current ? (now - startedAt.current) / 1000 : 0
  const level: 1 | 2 | 3 = elapsed >= cfg.levelUpAfterSeconds[1] ? 3 : elapsed >= cfg.levelUpAfterSeconds[0] ? 2 : 1
  const current = queue[turn]
  const currentPlayer = players.find((p) => p.name === current)

  const left = useCountdown(cfg.secondsPerTurn, phase === 'play', () => finish('timeout'), snippet?.id)

  function pickSnippet(lv: 1 | 2 | 3) {
    let pool = PARSED.filter((s) => s.level === lv && !used.current.has(s.id))
    if (!pool.length) {
      PARSED.filter((s) => s.level === lv).forEach((s) => used.current.delete(s.id))
      pool = PARSED.filter((s) => s.level === lv)
    }
    const s = pool[Math.floor(Math.random() * pool.length)]
    used.current.add(s.id)
    return s
  }

  function start() {
    const list = names.map((n) => n.trim()).filter(Boolean)
    if (list.length < 2) return
    setPlayers(list.map((name) => ({ name, alive: true, hints: cfg.hintsPerPlayer, time: 0, hits: 0 })))
    setQueue(list)
    setTurn(0)
    setRound(1)
    setResults({})
    used.current.clear()
    startedAt.current = Date.now()
    setNow(Date.now())
    setPhase('ready')
  }

  function beginTurn() {
    setSnippet(pickSnippet(level))
    setMarks({})
    setOutcome(null)
    setHintUsed(false)
    turnStart.current = performance.now()
    setPhase('play')
    sfx.click()
  }

  function takeHint() {
    if (!snippet || !currentPlayer || currentPlayer.hints <= 0 || hintUsed) return
    const n = snippet.lines.length
    const startLine = Math.max(1, Math.min(n - 2, snippet.bug - Math.floor(Math.random() * 3)))
    const m: typeof marks = {}
    for (let i = startLine; i < startLine + 3 && i <= n; i++) m[i] = 'hint'
    setMarks(m)
    setHintUsed(true)
    setPlayers((ps) => ps.map((p) => (p.name === current ? { ...p, hints: p.hints - 1 } : p)))
    sfx.hint()
  }

  function finish(o: Outcome, picked?: number) {
    if (phase !== 'play' || !snippet) return
    const took = (performance.now() - turnStart.current) / 1000
    setOutcome(o)
    setResults((r) => ({ ...r, [current]: o === 'ok' }))
    if (o === 'ok') {
      setMarks({ [snippet.bug]: 'correct' })
      setPlayers((ps) => ps.map((p) => (p.name === current ? { ...p, time: p.time + took, hits: p.hits + 1 } : p)))
      sfx.ok()
      burst(true)
      emitBugle({ type: 'bug_chapado', jugador: current })
    } else {
      setMarks(picked ? { [picked]: 'wrong', [snippet.bug]: 'answer' } : { [snippet.bug]: 'answer' })
      sfx.error()
    }
    setPhase('reveal')
  }

  function next() {
    if (turn + 1 < queue.length) {
      setTurn(turn + 1)
      setPhase('ready')
      return
    }
    // fin de ronda
    const failed = queue.filter((n) => !results[n])
    const out = failed.length === queue.length ? [] : failed
    const updated = players.map((p) => (out.includes(p.name) ? { ...p, alive: false } : p))
    setPlayers(updated)
    setEliminated(out)
    const alive = updated.filter((p) => p.alive)
    if (alive.length === 1 || (round >= cfg.maxRounds && alive.length > 0)) {
      const best = [...alive].sort((a, b) => b.hits - a.hits || a.time - b.time)[0]
      setWinner(best)
      setPhase('winner')
      sfx.win()
      party()
      emitBugle({ type: 'ganador_debug', jugador: best.name, bugs: best.hits })
      return
    }
    if (out.length) {
      sfx.lose()
      emitBugle({ type: 'eliminado', jugadores: out })
    }
    setPhase('roundEnd')
  }

  function nextRound() {
    const alive = players.filter((p) => p.alive).map((p) => p.name)
    setQueue(alive)
    setTurn(0)
    setResults({})
    setRound(round + 1)
    setPhase('ready')
  }

  // ---------- SETUP ----------
  if (phase === 'setup') {
    const add = () => {
      const n = draft.trim()
      if (n && !names.includes(n)) setNames([...names, n])
      setDraft('')
    }
    return (
      <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
        <div className="card col grow" style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: 44 }}>🐛 Debug Challenge</h2>
          <p style={{ margin: 0 }}>
            Fila india: cada quien tiene <b>{cfg.secondsPerTurn} s</b> para hacer clic en la línea con el bug. Si fallas, sales al terminar la ronda. ¡El último en pie gana!
          </p>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input className="input grow" placeholder="Nombre del participante" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} autoFocus />
            <button className="btn" onClick={add}>+ Agregar</button>
          </div>
          <div className="row" style={{ gap: 10 }}>
            {names.map((n, i) => (
              <span key={n} className="pill pop" style={{ background: i % 2 ? 'var(--lilac)' : 'var(--lime)' }}>
                {i + 1}. {n}
                <button onClick={() => setNames(names.filter((x) => x !== n))} style={{ border: 0, background: 'none', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </span>
            ))}
            {!names.length && <span className="muted">Agrega al menos 2 participantes.</span>}
          </div>
          <div className="row">
            <button className="btn big sun" disabled={names.length < 2} onClick={start}>¡Empezar! 🚀</button>
            <button className="btn white sm" onClick={() => setNames(shuffle(names))} disabled={names.length < 2}>🔀 Mezclar orden</button>
            <button className="btn white sm" onClick={() => setNames([])} disabled={!names.length}>Limpiar</button>
          </div>
        </div>
        <div className="card col" style={{ maxWidth: 380, background: 'var(--sun)' }}>
          <h3 style={{ fontSize: 28 }}>Reglas rápidas</h3>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 18 }}>
            <li>{cfg.hintsPerPlayer} pista por persona en toda la partida 💡</li>
            <li>Si <b>todos</b> fallan en una ronda, nadie sale.</li>
            <li>Máximo {cfg.maxRounds} rondas: si quedan varios, gana quien acertó más y en menos tiempo.</li>
            <li>La dificultad sube con el tiempo: muy fácil → fácil → medio.</li>
          </ul>
          <Mascot mood="think" size={110} className="bounce" />
        </div>
      </div>
    )
  }

  // ---------- WINNER ----------
  if (phase === 'winner' && winner) {
    return (
      <div className="center grow">
        <Mascot mood="party" size={180} className="bounce" />
        <div className="pill sun">🏆 Último en pie</div>
        <h1 style={{ fontSize: 96 }} className="pop">{winner.name}</h1>
        <p style={{ margin: 0, fontSize: 24 }}>
          {winner.hits} bugs chapados · {winner.time.toFixed(1)} s acumulados · {round} {round === 1 ? 'ronda' : 'rondas'}
        </p>
        <div className="row">
          <button className="btn big sun" onClick={() => onPrize({ game: 'debug', gameLabel: 'Debug Challenge', player: winner.name, score: `${winner.hits} bugs chapados` })}>🎡 Girar la ruleta</button>
          <button className="btn white" onClick={() => setPhase('setup')}>Nueva partida</button>
        </div>
      </div>
    )
  }

  // ---------- IN GAME ----------
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'nowrap' }}>
      <aside className="card col" style={{ width: 280, flexShrink: 0, gap: 10, padding: 18 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="pill sun">Ronda {round}/{cfg.maxRounds}</span>
          <span className="pill lilac">{LEVEL_NAME[level]}</span>
        </div>
        <ul className="board">
          {players.map((p) => {
            const isNow = p.name === current && phase !== 'roundEnd'
            const r = results[p.name]
            return (
              <li key={p.name} className={isNow ? 'me' : ''} style={{ opacity: p.alive ? 1 : 0.4, textDecoration: p.alive ? 'none' : 'line-through', background: !p.alive ? '#eee' : undefined }}>
                <span>{isNow ? '👉' : p.alive ? '🐞' : '💀'}</span>
                <span className="grow">{p.name}</span>
                <span style={{ fontSize: 16 }}>{'💡'.repeat(p.hints)}</span>
                {r !== undefined && <span>{r ? '✅' : '❌'}</span>}
              </li>
            )
          })}
        </ul>
        <div className="muted" style={{ fontSize: 15 }}>⏱️ {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, '0')} de partida</div>
        <button className="btn white sm" onClick={() => confirm('¿Terminar la partida?') && setPhase('setup')}>Terminar</button>
      </aside>

      <section className="col grow" style={{ minWidth: 0 }}>
        {phase === 'ready' && currentPlayer && (
          <div className="center card pop" style={{ minHeight: 420 }}>
            <div className="pill">Turno {turn + 1} de {queue.length}</div>
            <h1 style={{ fontSize: 88 }}>{currentPlayer.name}</h1>
            <p style={{ margin: 0, fontSize: 24 }}>¿Listo para cazar un bug? Tienes {cfg.secondsPerTurn} segundos.</p>
            <button className="btn big" onClick={beginTurn} autoFocus>¡Vamos! 🐛</button>
          </div>
        )}

        {(phase === 'play' || phase === 'reveal') && snippet && (
          <>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <h2 style={{ fontSize: 40 }}>{current}</h2>
              <div className="grow"><TimerBar left={phase === 'play' ? left : 0} total={cfg.secondsPerTurn} /></div>
              <button className="btn lilac" onClick={takeHint} disabled={phase !== 'play' || hintUsed || !currentPlayer || currentPlayer.hints <= 0}>
                💡 Pista ({currentPlayer?.hints ?? 0})
              </button>
            </div>
            <div className={outcome && outcome !== 'ok' ? 'shake' : ''}>
              <CodeView lines={snippet.lines} title={`${snippet.lang} · ¿Dónde está el bug?`} marks={marks} onPick={phase === 'play' ? (n) => finish(n === snippet.bug ? 'ok' : 'wrong', n) : undefined} />
            </div>
            {phase === 'reveal' && outcome && (
              <div className="row pop" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                <Mascot mood={outcome === 'ok' ? 'party' : 'sad'} size={110} />
                <div className="col grow" style={{ gap: 8 }}>
                  <span className={`banner ${outcome === 'ok' ? 'ok' : 'bad'}`} style={{ alignSelf: 'flex-start', fontSize: 40 }}>
                    {outcome === 'ok' ? '¡Bug chapado! 🎯' : outcome === 'timeout' ? '¡Se acabó el tiempo, causa! ⏰' : 'Uy, ese bug se escapó 🙈'}
                  </span>
                  <span style={{ fontSize: 20 }}><b>Línea {snippet.bug}:</b> {snippet.why}</span>
                </div>
                <button className="btn big" onClick={next} autoFocus>Siguiente ➜</button>
              </div>
            )}
          </>
        )}

        {phase === 'roundEnd' && <RoundEnd round={round} eliminated={eliminated} alive={players.filter((p) => p.alive).map((p) => p.name)} onNext={nextRound} />}
      </section>
    </div>
  )
}

function RoundEnd({ round, eliminated, alive, onNext }: { round: number; eliminated: string[]; alive: string[]; onNext: () => void }) {
  const msg = useMemo(() => (eliminated.length ? `Se despiden: ${eliminated.join(', ')} 👋` : 'Nadie sale esta ronda, ¡salvados! 😮‍💨'), [eliminated])
  return (
    <div className="center card pop" style={{ minHeight: 420 }}>
      <div className="pill sun">Fin de la ronda {round}</div>
      <h2 style={{ fontSize: 56 }}>{msg}</h2>
      <p style={{ margin: 0, fontSize: 22 }}>Siguen en pie: <b>{alive.join(', ')}</b></p>
      <button className="btn big" onClick={onNext} autoFocus>Ronda {round + 1} ➜</button>
    </div>
  )
}
