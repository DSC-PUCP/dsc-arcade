/**
 * Genera la galería a partir del contenido editado en Pages CMS.
 *
 *  content/eventos/*.json   → un archivo por evento (lo edita Pages CMS)
 *  media/galeria/*          → fotos originales subidas desde Pages CMS (URL guardada: /galeria/<archivo>)
 *
 * Salida (no versionada, se regenera en cada dev/build):
 *  public/fotos/<id>-<ancho>.webp    → versiones optimizadas
 *  src/generated/gallery.json         → datos con dimensiones para el mosaico
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const EVENTS_DIR = join(ROOT, 'content/eventos')
const MEDIA_DIR = join(ROOT, 'media/galeria')
const OUT_DIR = join(ROOT, 'public/fotos')
const DATA_OUT = join(ROOT, 'src/generated/gallery.json')
const SIZES = { thumb: 640, full: 1600 }

mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(join(ROOT, 'src/generated'), { recursive: true })

const files = existsSync(EVENTS_DIR) ? readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.json')) : []
const events = []
const photos = []
let warnings = 0

for (const file of files) {
  let ev
  try {
    ev = JSON.parse(readFileSync(join(EVENTS_DIR, file), 'utf8'))
  } catch (e) {
    console.warn(`⚠️  ${file}: JSON inválido (${e.message}), se omite`)
    warnings++
    continue
  }
  if (ev.publicado === false) continue
  const eventId = file.replace(/\.json$/, '')
  events.push({ id: eventId, nombre: ev.nombre ?? eventId, fecha: ev.fecha ?? '', lugar: ev.lugar ?? '', tipo: ev.tipo ?? 'evento', descripcion: ev.descripcion ?? '' })

  for (const [i, f] of (ev.fotos ?? []).entries()) {
    if (!f?.imagen) continue
    const rel = decodeURIComponent(String(f.imagen).replace(/^\/?galeria\//, ''))
    const src = join(MEDIA_DIR, rel)
    if (!existsSync(src)) {
      console.warn(`⚠️  ${file}: no existe ${src}`)
      warnings++
      continue
    }
    const buf = readFileSync(src)
    const id = createHash('sha1').update(buf).digest('hex').slice(0, 12)
    const img = sharp(buf, { failOn: 'none' }).rotate() // respeta orientación EXIF del celular
    const meta = await img.metadata()
    const portrait = (meta.orientation ?? 1) >= 5
    const w0 = portrait ? meta.height : meta.width
    const h0 = portrait ? meta.width : meta.height
    const out = {}
    for (const [key, width] of Object.entries(SIZES)) {
      const name = `${id}-${width}.webp`
      const dest = join(OUT_DIR, name)
      if (!existsSync(dest)) {
        await sharp(buf, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest)
      }
      out[key] = `/fotos/${name}`
    }
    const scale = Math.min(1, SIZES.full / w0)
    photos.push({
      id: `${eventId}-${i}`,
      eventId,
      src: out.full,
      thumb: out.thumb,
      width: Math.round(w0 * scale),
      height: Math.round(h0 * scale),
      descripcion: f.descripcion ?? '',
    })
  }
}

// Más recientes primero
events.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
const order = new Map(events.map((e, i) => [e.id, i]))
photos.sort((a, b) => order.get(a.eventId) - order.get(b.eventId))

writeFileSync(DATA_OUT, JSON.stringify({ events, photos }, null, 2))
console.log(`📸 Galería: ${events.length} eventos, ${photos.length} fotos${warnings ? `, ${warnings} avisos` : ''}`)
