import type { Mood } from '../components/Mascot'

// Banco offline de Bugle: se usa si no hay red, la API falla o hay 429.
export type LineKind = 'llamado' | 'celebracion' | 'consuelo' | 'reto' | 'dato' | 'redes'
export interface BugleLine { frase: string; emocion: Mood }

export const BUGLE_LINES: Record<LineKind, BugleLine[]> = {
  llamado: [
    { frase: '¡Habla, causa! ¿Tú encuentras un bug en quince segundos? Ven y demuéstralo.', emocion: 'point' },
    { frase: 'Oye, tú, el que está pasando. Sí, tú. Ven a jugar un ratito, que el arcade no muerde.', emocion: 'point' },
    { frase: 'Stand de DSC PUCP abierto. Juegos, premios y un pingüino que habla. ¿Qué más quieres?', emocion: 'happy' },
    { frase: '¿Escribes código más rápido que un compilador? Ven al Speedrun y farmea aura.', emocion: 'typing' },
    { frase: 'Se buscan valientes para el Debug Challenge. Requisitos: ojos y cero miedo a los bugs.', emocion: 'detective' },
    { frase: 'Juega un minuto, gira la ruleta y llévate algo. Así de fácil, causa.', emocion: 'gift' },
    { frase: 'Estoy aburrido de jugar solo. ¿Alguien me hace el favor de venir a ganarme?', emocion: 'sad' },
    { frase: '¿Distingues una verdad de una alucinación de IA? Yo a veces no, ayúdame.', emocion: 'think' },
    { frase: 'Ven con tus patas y retense en el Debug Challenge. Fila india, bugs para todos.', emocion: 'detective' },
    { frase: 'Pasa, pasa, que aquí no se cobra entrada. Solo se paga con puro talento.', emocion: 'happy' },
  ],
  celebracion: [
    { frase: '¡Bug chapado! Eso fue más rápido que un deploy un viernes.', emocion: 'party' },
    { frase: '¡Uff, qué nivel! Ya estás listo para una hackathon de DSC PUCP.', emocion: 'party' },
    { frase: '¡Bacán! Ese récord va a estar difícil de romper. ¿Quién se anima?', emocion: 'party' },
    { frase: '¡Ganaste! Gira la ruleta, que el premio te está esperando.', emocion: 'gift' },
    { frase: '¡Eso, causa! Aura farmeada con éxito.', emocion: 'party' },
    { frase: '¡Qué tal crack! Hasta mi capucha se sorprendió.', emocion: 'party' },
  ],
  consuelo: [
    { frase: 'Uy, ese bug se escapó. Tranqui, a mí también me pasa todos los días.', emocion: 'sad' },
    { frase: 'Eliminado, pero con estilo. La revancha está a un clic.', emocion: 'sad' },
    { frase: 'No pasa nada, hasta los seniors tienen bugs en producción.', emocion: 'think' },
    { frase: 'Casi casi. Un intento más y ya la tienes, te lo juro por mi pico.', emocion: 'happy' },
  ],
  reto: [
    { frase: '¿Quién se atreve a romper el récord del Speedrun? Yo apuesto por ti.', emocion: 'typing' },
    { frase: 'Reto del momento: chapar tres bugs seguidos. ¿Quién puede?', emocion: 'detective' },
    { frase: 'Ocho logos, diez segundos cada uno. ¿Te los sabes todos? Lo dudo, demuéstrame lo contrario.', emocion: 'think' },
    { frase: 'Traigan a su amigo que se cree programador. Aquí lo comprobamos.', emocion: 'point' },
    { frase: 'El ranking del Speedrun está muy tranquilo. Alguien sacúdalo, por favor.', emocion: 'typing' },
    { frase: 'Una IA dijo algo convincente. ¿Verdad o alucinación? Ven a descubrirlo.', emocion: 'think' },
  ],
  dato: [
    { frase: 'Dato nerd: el primer bug registrado fue una polilla de verdad, atrapada en una computadora.', emocion: 'detective' },
    { frase: 'Dato curioso: Python se llama así por un grupo de comedia, no por la serpiente.', emocion: 'think' },
    { frase: 'Dato tech: el primer dominio punto com se registró en 1985. Yo todavía no era pingüino.', emocion: 'think' },
    { frase: 'Dato: JavaScript se creó en unos diez días. Y se nota, causa.', emocion: 'typing' },
    { frase: 'Dato pingüino: Linux tiene de mascota a otro pingüino. Somos la especie más dev.', emocion: 'happy' },
    { frase: 'Dato: Git lo creó el mismo autor de Linux, en un par de semanas.', emocion: 'think' },
  ],
  redes: [
    { frase: 'En DSC PUCP aprendemos construyendo proyectos reales. Este arcade lo hicimos nosotros.', emocion: 'happy' },
    { frase: 'Síguenos en Instagram como dsc punto pucp y entérate de talleres y hackathons.', emocion: 'point' },
    { frase: 'Escanea el QR de Comunidad y únete al grupo. Ahí avisamos todo primero.', emocion: 'point' },
    { frase: '¿Quieres hacer proyectos de verdad? Únete a Developer Student Club PUCP.', emocion: 'happy' },
    { frase: 'Talleres, hackathons y gente bacán. Eso es DSC PUCP, causa.', emocion: 'party' },
    { frase: 'Toca el botón de Comunidad arriba y súmate. Sin compromiso, con mucho código.', emocion: 'point' },
    { frase: 'Aquí no necesitas saber todo. En DSC aprendemos juntos, a punta de proyectos.', emocion: 'happy' },
    { frase: 'Si te gustó el arcade, imagina lo que puedes construir con nosotros.', emocion: 'gift' },
  ],
}

const recent: string[] = []
export function offlineLine(kind?: LineKind): BugleLine {
  const kinds = Object.keys(BUGLE_LINES) as LineKind[]
  const k = kind ?? (['llamado', 'llamado', 'reto', 'dato', 'redes'] as LineKind[])[Math.floor(Math.random() * 5)] ?? kinds[0]
  const pool = BUGLE_LINES[k].filter((l) => !recent.includes(l.frase))
  const l = (pool.length ? pool : BUGLE_LINES[k])[Math.floor(Math.random() * (pool.length || BUGLE_LINES[k].length))]
  recent.push(l.frase)
  if (recent.length > 12) recent.shift()
  return l
}
