import { useState } from 'react'

export type Mood = 'happy' | 'sad' | 'think' | 'party' | 'typing' | 'detective' | 'gift' | 'point'

/**
 * Bugle, el pingüino dev de DSC PUCP.
 * Usa /mascot/bugle-<mood>.png. Si ese PNG no existe, cae a bugle-happy.png y luego al bug SVG de respaldo.
 */
export function Mascot({ mood = 'happy', size = 140, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const [step, setStep] = useState(0)
  const srcs = mood === 'happy' ? ['/mascot/bugle-happy.png'] : [`/mascot/bugle-${mood}.png`, '/mascot/bugle-happy.png']
  if (step < srcs.length) {
    return (
      <img
        key={srcs[step]}
        src={srcs[step]}
        alt=""
        aria-hidden
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={() => setStep((s) => s + 1)}
      />
    )
  }
  return <BugFallback mood={mood} size={size} className={className} />
}

function BugFallback({ mood, size, className }: { mood: Mood; size: number; className: string }) {
  const body = mood === 'sad' ? '#ff6b6b' : '#7be36f'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      <g stroke="#2b2670" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M46 26 Q40 10 30 8" /><path d="M74 26 Q80 10 90 8" />
        <path d="M24 58 L8 50" /><path d="M24 72 L6 76" /><path d="M28 86 L14 98" />
        <path d="M96 58 L112 50" /><path d="M96 72 L114 76" /><path d="M92 86 L106 98" />
      </g>
      <circle cx="30" cy="8" r="6" fill="#ffd23f" stroke="#2b2670" strokeWidth="4" />
      <circle cx="90" cy="8" r="6" fill="#ffd23f" stroke="#2b2670" strokeWidth="4" />
      <ellipse cx="60" cy="68" rx="38" ry="42" fill={body} stroke="#2b2670" strokeWidth="4" />
      <path d="M60 30 L60 108" stroke="#2b2670" strokeWidth="3" opacity="0.35" />
      <circle cx="44" cy="80" r="5" fill="#2b2670" opacity="0.25" /><circle cx="78" cy="88" r="4" fill="#2b2670" opacity="0.25" />
      {mood === 'think' ? (
        <>
          <circle cx="47" cy="56" r="7" fill="white" stroke="#2b2670" strokeWidth="3" /><circle cx="49" cy="54" r="3" fill="#2b2670" />
          <circle cx="73" cy="56" r="7" fill="white" stroke="#2b2670" strokeWidth="3" /><circle cx="75" cy="54" r="3" fill="#2b2670" />
          <path d="M52 76 L68 74" stroke="#2b2670" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : mood === 'sad' ? (
        <>
          <path d="M40 54 L52 58 M80 54 L68 58" stroke="#2b2670" strokeWidth="4" strokeLinecap="round" />
          <circle cx="47" cy="62" r="4" fill="#2b2670" /><circle cx="73" cy="62" r="4" fill="#2b2670" />
          <path d="M48 82 Q60 72 72 82" stroke="#2b2670" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={mood === 'party' ? 'M40 58 Q47 50 54 58 M66 58 Q73 50 80 58' : 'M41 58 Q47 52 53 58 M67 58 Q73 52 79 58'} stroke="#2b2670" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M46 72 Q60 90 74 72 Z" fill="#2b2670" />
          <circle cx="38" cy="70" r="5" fill="#ff6b6b" opacity="0.5" /><circle cx="82" cy="70" r="5" fill="#ff6b6b" opacity="0.5" />
        </>
      )}
    </svg>
  )
}
