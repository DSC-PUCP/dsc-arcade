import { useEffect, useState } from 'react'
import { Mascot } from './Mascot'
import { config } from '../lib/config'
import { bootBugle, pttStart, pttStop, setEnabled, setMicOn, setStandKey, setVoiceOn, useBugle } from '../lib/bugle/orchestrator'
import { voiceName } from '../lib/bugle/voice'

const PTT_KEY = config.bugle.pushToTalkKey

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
          <div className="card modal pop col" style={{ gap: 14, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 34 }}>🐧 Bugle en vivo</h2>
            <p className="muted" style={{ margin: 0 }}>
              Bugle habla solo cada ~{config.bugle.ambientSeconds} s y reacciona a los juegos. Mantén <b>{PTT_KEY}</b> o el botón 🎤 para hablarle.
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
            <span className="muted" style={{ fontSize: 15 }}>Voz: {voiceName()}{b.micError ? ` · ⚠️ ${b.micError}` : ''}</span>
            <button className="btn" onClick={() => setOpen(false)}>Listo</button>
          </div>
        </div>
      )}
    </>
  )
}

/** Bugle animado mientras habla, aviso de mic y botón pulsar-para-hablar. */
export function BugleStage({ hidden }: { hidden?: boolean }) {
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
    <div className={`bugle-live${hidden ? ' behind' : ''}`}>
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
