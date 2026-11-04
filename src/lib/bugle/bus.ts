// Bus simple de eventos de los juegos → Bugle en vivo.
// Todos los eventos se suman a la "bolsa" de hechos que Bugle recibe como contexto;
// los marcados como grandes además pueden disparar una frase al momento.
export type BugleEvent =
  | { type: 'ruleta'; premio: string }
  | { type: 'record'; jugador?: string; wpm: number; precision: number; anterior?: { jugador: string; wpm: number } }
  | { type: 'speedrun'; wpm: number; precision: number; texto: string; premio: boolean }
  | { type: 'speedrun_guardado'; jugador: string; wpm: number; puesto: number; total: number }
  | { type: 'debug_inicio'; jugadores: string[] }
  | { type: 'bug_chapado'; jugador: string; segundos: number }
  | { type: 'bug_fallado'; jugador: string; motivo: 'equivocado' | 'tiempo' }
  | { type: 'eliminado'; jugadores: string[]; quedan: number }
  | { type: 'ganador_debug'; jugador: string; bugs: number }
  | { type: 'respuesta'; juego: string; acierto: boolean; detalle: string }
  | { type: 'quiz'; juego: string; correctas: number; total: number }

/** Eventos que justifican hablar ya (si pasó el tiempo mínimo entre frases). */
export const BIG_EVENTS: BugleEvent['type'][] = ['ruleta', 'record', 'speedrun', 'ganador_debug', 'eliminado', 'quiz', 'debug_inicio']

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
    case 'ruleta': return `Ruleta: a alguien le salió "${e.premio}"`
    case 'record': return `Speedrun: NUEVO RÉCORD de ${e.jugador ?? 'alguien'} con ${e.wpm} WPM y ${e.precision}% de precisión${e.anterior ? ` (superó a ${e.anterior.jugador}, que tenía ${e.anterior.wpm} WPM)` : ''}`
    case 'speedrun': return `Speedrun: alguien terminó "${e.texto}" con ${e.wpm} WPM y ${e.precision}% de precisión${e.premio ? ', ganó la ruleta' : ', no le alcanzó para premio'}`
    case 'speedrun_guardado': return `Speedrun: ${e.jugador} guardó ${e.wpm} WPM y quedó en el puesto ${e.puesto} de ${e.total}`
    case 'debug_inicio': return `Debug Challenge: empezó una partida con ${e.jugadores.join(', ')}`
    case 'bug_chapado': return `Debug Challenge: ${e.jugador} chapó el bug en ${e.segundos} s`
    case 'bug_fallado': return `Debug Challenge: a ${e.jugador} se le escapó el bug (${e.motivo === 'tiempo' ? 'se le acabó el tiempo' : 'marcó la línea equivocada'})`
    case 'eliminado': return `Debug Challenge: eliminados ${e.jugadores.join(', ')}; quedan ${e.quedan}`
    case 'ganador_debug': return `Debug Challenge: ${e.jugador} GANÓ con ${e.bugs} bugs chapados`
    case 'respuesta': return `${e.juego}: ${e.acierto ? 'acertó' : 'falló'} (${e.detalle})`
    case 'quiz': return `${e.juego}: terminó la partida con ${e.correctas} de ${e.total} correctas`
  }
}
