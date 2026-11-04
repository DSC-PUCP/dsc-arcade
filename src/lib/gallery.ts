import data from '../generated/gallery.json'

export interface GalleryEvent { id: string; nombre: string; fecha: string; lugar: string; tipo: string; descripcion: string }
export interface GalleryPhoto { id: string; eventId: string; src: string; thumb: string; width: number; height: number; descripcion: string }

export const EVENTS = data.events as GalleryEvent[]
export const PHOTOS = data.photos as GalleryPhoto[]
export const eventById = new Map(EVENTS.map((e) => [e.id, e]))

export const TIPOS: Record<string, { label: string; emoji: string; color: string }> = {
  evento: { label: 'Eventos', emoji: '🎤', color: 'var(--lime)' },
  taller: { label: 'Talleres', emoji: '🛠️', color: 'var(--sun)' },
  hackathon: { label: 'Hackathons', emoji: '⚡', color: 'var(--lilac)' },
  proyecto: { label: 'Proyectos', emoji: '🚀', color: '#9fd8ff' },
  comunidad: { label: 'Comunidad', emoji: '💚', color: '#ff9f9f' },
}

export function formatFecha(f: string) {
  if (!f) return ''
  const d = new Date(`${f}T12:00:00`)
  return Number.isNaN(d.getTime()) ? f : d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
}
