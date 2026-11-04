// Bus simple de eventos de los juegos → Bugle en vivo.
export type BugleEvent =
  | { type: 'ruleta'; premio: string }
  | { type: 'record'; jugador?: string; wpm: number; precision: number }
  | { type: 'speedrun'; wpm: number; precision: number }
  | { type: 'bug_chapado'; jugador: string }
  | { type: 'eliminado'; jugadores: string[] }
  | { type: 'ganador_debug'; jugador: string; bugs: number }
  | { type: 'quiz'; juego: string; correctas: number; total: number }

type Listener = (e: BugleEvent) => void
const listeners = new Set<Listener>()

export function emitBugle(e: BugleEvent) {
  listeners.forEach((l) => {
    try {
      l(e)
    } catch {
      /* Bugle nunca debe romper un juego */
    }
  })
}

export function onBugle(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function describeEvent(e: BugleEvent): string {
  switch (e.type) {
    case 'ruleta': return `Alguien giró la ruleta y le salió: ${e.premio}`
    case 'record': return `¡Nuevo récord en el Speedrun! ${e.jugador ?? 'Alguien'} hizo ${e.wpm} WPM con ${e.precision}% de precisión`
    case 'speedrun': return `Alguien terminó el Speedrun con ${e.wpm} WPM y ${e.precision}% de precisión`
    case 'bug_chapado': return `${e.jugador} chapó un bug en el Debug Challenge`
    case 'eliminado': return `Eliminados en el Debug Challenge: ${e.jugadores.join(', ')}`
    case 'ganador_debug': return `${e.jugador} ganó el Debug Challenge con ${e.bugs} bugs chapados`
    case 'quiz': return `Resultado en ${e.juego}: ${e.correctas} de ${e.total} correctas`
  }
}
