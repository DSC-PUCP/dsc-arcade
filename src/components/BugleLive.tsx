import { useEffect, useState, useSyncExternalStore } from 'react'
import { Mascot } from './Mascot'
import { config } from '../lib/config'
import { bootBugle, forceLine, getLastContext, pttStart, pttStop, setEnabled, setMicOn, setStandKey, setVoiceOn, useBugle } from '../lib/bugle/orchestrator'
import { listVoices, onVoices, prefs, setVoicePrefs, speak, voiceName } from '../lib/bugle/voice'
import { clearLog, getLog, subscribeLog, type LogKind } from '../lib/bugle/log'
import { emitBugle, type BugleEvent } from '../lib/bugle/bus'

const PTT_KEY = config.bugle.pushToTalkKey
const DEBUG_KEY = 'F9'

function useVoices() {
  const [, force] = useState(0)
  useEffect(() => onVoices(() => force((n) => n + 1)), [])
  return listVoices()
}

function VoicePicker() {
  const voices = useVoices()
  const [, force] = useState(0)
  const upd = (p: Partial<typeof prefs>) => {
    setVoicePrefs(p)
    force((n) => n + 1)
  }
  return (
    <div className="col" style={{ gap: 8 }}>
      <span style={{ fontWeight: 800 }}>Voz de Bugle</span>
      <div className="row" style={{ gap: 8 }}>
        <select className="input" value={prefs.voice} onChange={(e) => upd({ voice: e.target.value })} style={{ flex: 1, fontSize: 16, minWidth: 0 }}>
          <option value="">Automática (prefiere masculina neuronal) · {voiceName()}</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
          ))}
        </select>
        <button className="btn white sm" onClick={() => void speak('¡Habla, causa! Soy Bugle, el pingüino de DSC PUCP. ¿Juegas?')}>▶ Probar</button>
      </div>
      <label className="row" style={{ gap: 10, fontSize: 16 }}>
        Tono <input type="range" min={0.5} max={1.6} step={0.05} value={prefs.pitch} onChange={(e) => upd({ pitch: Number(e.target.value) })} style={{ flex: 1 }} /> {prefs.pitch.toFixed(2)}
      </label>
      <label className="row" style={{ gap: 10, fontSize: 16 }}>
        Velocidad <input type="range" min={0.7} max={1.5} step={0.05} value={prefs.rate} onChange={(e) => upd({ rate: Number(e.target.value) })} style={{ flex: 1 }} /> {prefs.rate.toFixed(2)}
      </label>
      {!voices.some((v) => /natural|online/i.test(v.name)) && (
        <span className="muted" style={{ fontSize: 14 }}>Este navegador no trae voces neuronales. En Edge suenan mucho mejor (p. ej. Jorge, Álvaro).</span>
      )}
    </div>
  )
}

/** Controles discretos del encargado (van en la topbar). */
export function BugleControls() {
  const b = useBugle()
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')

  useEffect(() => {
    bootBugle()
  }, [])

  return (
    <>
      {b.enabled && (
        <>
          <button className={`icon-btn${b.micOn ? '' : ' off'}`} title={b.micOn ? 'Mic on: Bugle escucha el ambiente (clic para apagar)' : 'Mic off'} onClick={() => setMicOn(!b.micOn)}>
            {b.micOn ? '🎙️' : '🚫'}
          </button>
          <button className={`icon-btn${b.voiceOn ? '' : ' off'}`} title={b.voiceOn ? 'Voz de Bugle on (clic para silenciar ya)' : 'Voz de Bugle off'} onClick={() => setVoiceOn(!b.voiceOn)}>
            {b.voiceOn ? '🗣️' : '🤐'}
          </button>
        </>
      )}
      <button className={`icon-btn${b.enabled ? ' on' : ''}`} title="Bugle en vivo" onClick={() => setOpen(true)}>🐧</button>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="card modal pop col" style={{ gap: 14, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 34 }}>🐧 Bugle en vivo</h2>
            <p className="muted" style={{ margin: 0 }}>
              Bugle habla solo cada ~{config.bugle.ambientSeconds} s y reacciona a los juegos. Mantén <b>{PTT_KEY}</b> o el botón 🎤 para hablarle. <b>{DEBUG_KEY}</b> abre el panel de depuración.
            </p>
            <label className="row" style={{ gap: 10, fontWeight: 800 }}>
              <input type="checkbox" checked={b.enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 24, height: 24 }} />
              Activar Bugle en vivo
            </label>
            <div className="col" style={{ gap: 6 }}>
              <span style={{ fontWeight: 800 }}>Clave del stand {b.hasKey ? '✅ guardada' : '⚠️ sin clave (solo frases offline)'}</span>
              <div className="row" style={{ gap: 8 }}>
                <input className="input" type="password" placeholder="STAND_KEY" value={key} onChange={(e) => setKey(e.target.value)} style={{ flex: 1, fontSize: 18 }} />
                <button className="btn sm" onClick={() => { setStandKey(key.trim()); setKey('') }} disabled={!key.trim()}>Guardar</button>
                {b.hasKey && <button className="btn white sm" onClick={() => setStandKey('')}>Borrar</button>}
              </div>
            </div>
            <VoicePicker />
            {b.micError && <span className="muted" style={{ fontSize: 15 }}>⚠️ {b.micError}</span>}
            <button className="btn" onClick={() => setOpen(false)}>Listo</button>
          </div>
        </div>
      )}
    </>
  )
}

const SIMS: { label: string; e: BugleEvent }[] = [
  { label: '🏆 Récord speedrun', e: { type: 'record', jugador: 'Ana', wpm: 62, precision: 97, anterior: { jugador: 'Diego', wpm: 48 } } },
  { label: '🤖 Falla en Verdad/Aluc.', e: { type: 'respuesta', juego: '¿Verdad o Alucinación?', acierto: false, detalle: 'se creyó una alucinación de IA: "GPT-4 fue entrenado solo con Wikipedia"' } },
  { label: '🐛 Eliminados', e: { type: 'eliminado', jugadores: ['Luis', 'Carla'], quedan: 2 } },
  { label: '🎡 Ruleta', e: { type: 'ruleta', premio: 'Chocolate' } },
  { label: '🧩 Quiz logos 3/8', e: { type: 'quiz', juego: 'Adivina el Logo', correctas: 3, total: 8 } },
]

const KIND_BG: Partial<Record<LogKind, string>> = { error: '#ffd9d9', ia: '#e3f7e1', offline: '#fff2c9', evento: '#ebe9ff', chat: '#ffe3ee' }

/** Panel de depuración (F9): estado, log en vivo, último contexto y simuladores. Todo en memoria del navegador. */
export function BugleDebug() {
  const [open, setOpen] = useState(false)
  const [showCtx, setShowCtx] = useState(false)
  const b = useBugle()
  const log = useSyncExternalStore(subscribeLog, getLog)

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== DEBUG_KEY) return
      e.preventDefault()
      setOpen((o) => !o)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  if (!open) return null
  const flags: [string, boolean][] = [
    ['activo', b.enabled], ['mic', b.micOn], ['voz', b.voiceOn], ['clave', b.hasKey],
    ['hablando', b.speaking], ['oye voz', b.hearing], ['grabando', b.recording], ['pensando', b.thinking],
  ]
  return (
    <div className="card bugle-debug pop">
      <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <b style={{ fontSize: 20 }}>🐧 Bugle · depuración</b>
        <span className="muted" style={{ fontSize: 13 }}>{DEBUG_KEY} para cerrar · nada se guarda</span>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {flags.map(([n, v]) => (
          <span key={n} className={`pill${v ? ' lime' : ''}`} style={{ fontSize: 13, padding: '1px 8px' }}>{v ? '●' : '○'} {n}</span>
        ))}
      </div>
      <div style={{ fontSize: 13 }}>
        Voz: <b>{voiceName()}</b> · última frase ({b.source ?? '—'}): <i>{b.lastLine ?? '—'}</i>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={forceLine} disabled={!b.enabled}>💬 Forzar frase</button>
        <button className="btn white sm" onClick={() => void speak('Probando, probando. Bugle en el aire.')}>🔊 Probar voz</button>
        <button className="btn white sm" onClick={() => setShowCtx((s) => !s)}>{showCtx ? 'Ocultar' : 'Ver'} contexto</button>
        <button className="btn white sm" onClick={clearLog}>🧹 Limpiar</button>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <span className="muted" style={{ fontSize: 13 }}>Simular:</span>
        {SIMS.map((s) => (
          <button key={s.label} className="btn white sm" style={{ fontSize: 13, padding: '3px 8px' }} onClick={() => emitBugle(s.e)}>{s.label}</button>
        ))}
      </div>
      {showCtx && <pre className="bugle-debug-ctx">{JSON.stringify(getLastContext(), null, 2) ?? 'Aún no se pidió ninguna frase.'}</pre>}
      <div className="bugle-debug-log">
        {[...log].reverse().map((e) => (
          <div key={e.id} style={{ background: KIND_BG[e.kind] }}>
            <span className="muted">{new Date(e.at).toLocaleTimeString('es-PE')}</span> <b>{e.kind}</b> {e.msg}
            {e.data !== undefined && (
              <details>
                <summary>datos</summary>
                <pre>{JSON.stringify(e.data, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
        {!log.length && <div className="muted">Sin actividad todavía.</div>}
      </div>
    </div>
  )
}

/** Bugle animado mientras habla, aviso de mic y botón pulsar-para-hablar. */
export function BugleStage() {
  const b = useBugle()

  useEffect(() => {
    if (!b.enabled) return
    const down = (e: KeyboardEvent) => {
      if (e.key !== PTT_KEY) return
      e.preventDefault()
      if (!e.repeat) void pttStart()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key !== PTT_KEY) return
      e.preventDefault()
      void pttStop()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [b.enabled])

  if (!b.enabled) return null
  const show = b.speaking || b.thinking || b.recording
  const mood = b.recording ? 'point' : b.thinking ? 'think' : b.mood

  return (
    <div className="bugle-live">
      {b.micOn && (
        <div className={`pill bugle-mic${b.hearing ? ' hearing' : ''}`} title="El audio se transcribe al momento y no se guarda">
          🎙️ Bugle está escuchando el stand
        </div>
      )}
      {show && (
        <div className={`bugle-avatar pop${b.speaking ? ' talking' : ''}`} key={mood}>
          <Mascot mood={mood} size={190} />
        </div>
      )}
      <button
        className={`btn bugle-ptt${b.recording ? ' rec' : ''}`}
        title={`Mantén presionado (o la tecla ${PTT_KEY}) para hablarle a Bugle`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          void pttStart()
        }}
        onPointerUp={() => void pttStop()}
        onPointerCancel={() => void pttStop()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {b.recording ? '🔴 Te escucho…' : b.thinking ? '🤔 Pensando…' : '🎤 Mantén para hablarle a Bugle'}
      </button>
    </div>
  )
}
