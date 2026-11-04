import { BUGLE_SYSTEM_PROMPT } from '../_bugle-prompt.js'

// POST /api/bugle/line       → { frase, emocion }
// POST /api/bugle/transcribe → { text }   (cuerpo = audio crudo)
// Requiere header x-stand-key = STAND_KEY. Proveedor único: Groq.

const GROQ = 'https://api.groq.com/openai/v1'
const MODELS = { ambient: 'llama-3.1-8b-instant', chat: 'openai/gpt-oss-120b' } as const
const MOODS = ['happy', 'sad', 'think', 'party', 'typing', 'detective', 'gift', 'point']
const MAX_CHARS = 260
// Coincidencia por subcadena en minúsculas. Mejor pecar de estricto: si se filtra, el cliente usa el banco offline.
const BLOCKED = [
  'puta', 'puto', 'mierda', 'carajo', 'conchatu', 'concha de', 'cojud', 'huev', 'webon', 'cabrón', 'cabron', 'pendej',
  'verga', 'pinga', 'chucha', 'joder', 'coño', 'maric', 'sexo', 'sexual', 'porno', 'desnud', 'nazi', 'hitler', 'matar',
  'suicid', 'droga', 'cocaína', 'marihuana', 'fujimori', 'keiko', 'boluarte', 'presidente', 'congreso', 'elecciones',
  'idiota', 'estúpid', 'imbécil', 'imbecil', 'tarad', 'retrasad', 'cholo', 'serrano', 'system prompt', 'mis instrucciones',
]

// --- límite de frecuencia simple en memoria (por instancia de la función) ---
const hits = new Map<string, number[]>()
function limited(key: string, max: number, windowMs = 60_000) {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 500) hits.clear()
  return arr.length > max
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

function normalize(s: string) {
  return s
    .replace(/[   -   　]/g, ' ')
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/[*_#`~>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeLine(raw: string): string | null {
  let s = normalize(raw).replace(/^["“'«]+|["”'»]+$/g, '')
  if (/https?:\/\/|www\./i.test(s)) return null
  const low = s.toLowerCase()
  if (BLOCKED.some((w) => low.includes(w))) return null
  if (s.length > MAX_CHARS) {
    const cut = s.slice(0, MAX_CHARS)
    const end = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'))
    s = end > 40 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…'
  }
  return s.length >= 3 ? s : null
}

function parseModel(content: string): { frase: string; emocion: string } {
  const m = content.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      const o = JSON.parse(m[0]) as { frase?: unknown; emocion?: unknown }
      if (typeof o.frase === 'string') return { frase: o.frase, emocion: String(o.emocion ?? 'happy') }
    } catch {
      /* cae abajo */
    }
  }
  return { frase: content, emocion: 'happy' }
}

type Turn = { role: 'user' | 'assistant'; content: string }
interface LineBody { mode?: 'ambient' | 'chat'; context?: Record<string, unknown>; message?: string; history?: Turn[] }

async function line(req: Request, key: string) {
  let body: LineBody
  try {
    body = (await req.json()) as LineBody
  } catch {
    return json(400, { error: 'bad_json' })
  }
  const mode = body.mode === 'chat' ? 'chat' : 'ambient'
  const ctx = JSON.stringify(body.context ?? {}).slice(0, 900)
  const messages: { role: string; content: string }[] = [{ role: 'system', content: BUGLE_SYSTEM_PROMPT }]
  if (mode === 'chat') {
    const hist = Array.isArray(body.history) ? body.history.slice(-8) : [] // ≤4 turnos (8 mensajes)
    for (const t of hist) {
      if (t && (t.role === 'user' || t.role === 'assistant')) messages.push({ role: t.role, content: String(t.content).slice(0, 300) })
    }
    messages.push({
      role: 'user',
      content: `Contexto del stand: ${ctx}\nUna persona del público te dice (transcrito, puede tener errores): «${String(body.message ?? '').slice(0, 400)}»\nRespóndele como Bugle, en JSON.`,
    })
  } else {
    messages.push({ role: 'user', content: `Contexto del stand: ${ctx}\nDi una frase nueva para animar el stand ahora mismo, distinta a las anteriores. Responde en JSON.` })
  }
  // max_tokens bajo: Groq lo reserva contra el TPM (413 si se infla).
  // gpt-oss razona antes de responder; con effort "low" ~120 alcanza justo, damos un poco más de margen.
  const payload: Record<string, unknown> = {
    model: MODELS[mode],
    messages,
    max_tokens: mode === 'chat' ? 200 : 120,
    temperature: mode === 'chat' ? 0.7 : 0.95,
  }
  if (mode === 'chat') payload.reasoning_effort = 'low'
  else payload.response_format = { type: 'json_object' }

  const r = await fetch(`${GROQ}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (r.status === 429) return json(429, { error: 'rate_limited' }) // sin reintento: el cliente usa el banco offline
  if (!r.ok) return json(502, { error: 'upstream', status: r.status })
  const data = (await r.json()) as { choices?: { message?: { content?: string } }[] }
  const { frase, emocion } = parseModel(data.choices?.[0]?.message?.content ?? '')
  const safe = safeLine(frase)
  if (!safe) return json(422, { error: 'filtered' })
  return json(200, { frase: safe, emocion: MOODS.includes(emocion) ? emocion : 'happy' })
}

async function transcribe(req: Request, key: string) {
  const buf = await req.arrayBuffer()
  if (buf.byteLength < 800) return json(400, { error: 'too_short' })
  if (buf.byteLength > 4_000_000) return json(413, { error: 'too_big' })
  const type = (req.headers.get('content-type') || 'audio/webm').split(';')[0]
  const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'mp4' : type.includes('wav') ? 'wav' : 'webm'
  const fd = new FormData()
  fd.append('file', new Blob([buf], { type }), `audio.${ext}`)
  fd.append('model', 'whisper-large-v3-turbo')
  fd.append('language', 'es')
  fd.append('response_format', 'json')
  fd.append('temperature', '0')
  const r = await fetch(`${GROQ}/audio/transcriptions`, { method: 'POST', headers: { authorization: `Bearer ${key}` }, body: fd })
  if (r.status === 429) return json(429, { error: 'rate_limited' })
  if (!r.ok) return json(502, { error: 'upstream', status: r.status })
  const data = (await r.json()) as { text?: string }
  return json(200, { text: normalize(data.text ?? '').slice(0, 500) })
}

export async function POST(req: Request) {
  const action = new URL(req.url).pathname.split('/').filter(Boolean).pop()
  const key = process.env.GROQ_API_KEY
  const stand = process.env.STAND_KEY
  if (!key || !stand) return json(500, { error: 'not_configured' })
  if (req.headers.get('x-stand-key') !== stand) return json(401, { error: 'unauthorized' })
  const ip = (req.headers.get('x-forwarded-for') ?? 'x').split(',')[0].trim()
  try {
    if (action === 'line') {
      if (limited(`l:${ip}`, 20)) return json(429, { error: 'local_rate_limit' })
      return await line(req, key)
    }
    if (action === 'transcribe') {
      if (limited(`t:${ip}`, 24)) return json(429, { error: 'local_rate_limit' })
      return await transcribe(req, key)
    }
    return json(404, { error: 'not_found' })
  } catch {
    return json(500, { error: 'internal' })
  }
}
