// Log de Bugle en vivo: consola con colores + buffer en memoria (máx. 150) para el panel de depuración (F9).
// Nada se persiste: se borra al recargar.

export type LogKind = 'evento' | 'turno' | 'api' | 'ia' | 'offline' | 'voz' | 'mic' | 'stt' | 'chat' | 'estado' | 'error'
export interface LogEntry { id: number; at: number; kind: LogKind; msg: string; data?: unknown }

const COLORS: Record<LogKind, string> = {
  evento: '#3F3797', turno: '#2B2670', api: '#888', ia: '#2e9e2b', offline: '#c98a00', voz: '#7a5cff',
  mic: '#0a84c6', stt: '#0a84c6', chat: '#d6336c', estado: '#555', error: '#e03131',
}

let entries: LogEntry[] = []
let seq = 0
const subs = new Set<() => void>()

export function blog(kind: LogKind, msg: string, data?: unknown) {
  const e: LogEntry = { id: ++seq, at: Date.now(), kind, msg, data }
  entries = [...entries.slice(-149), e]
  const style = `color:white;background:${COLORS[kind]};padding:1px 6px;border-radius:4px;font-weight:bold`
  if (data === undefined) console.log(`%c[bugle:${kind}]`, style, msg)
  else console.log(`%c[bugle:${kind}]`, style, msg, data)
  subs.forEach((f) => f())
}

export const getLog = () => entries
export function clearLog() {
  entries = []
  subs.forEach((f) => f())
}
export function subscribeLog(f: () => void) {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}
