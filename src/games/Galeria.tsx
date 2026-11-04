import { useMemo, useState } from 'react'
import { MasonryPhotoAlbum, type Photo } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import { PHOTOS, TIPOS, eventById, formatFecha, type GalleryPhoto } from '../lib/gallery'
import { Mascot } from '../components/Mascot'

type AlbumPhoto = Photo & { g: GalleryPhoto }

export function Galeria() {
  const tipos = useMemo(() => [...new Set(PHOTOS.map((p) => eventById.get(p.eventId)?.tipo ?? 'evento'))], [])
  const [filtro, setFiltro] = useState<string | null>(null)
  const [index, setIndex] = useState(-1)

  const visibles = useMemo(() => PHOTOS.filter((p) => !filtro || eventById.get(p.eventId)?.tipo === filtro), [filtro])
  const album: AlbumPhoto[] = visibles.map((g) => ({ src: g.thumb, width: g.width, height: g.height, key: g.id, alt: g.descripcion || eventById.get(g.eventId)?.nombre, g }))
  const slides = visibles.map((g) => {
    const ev = eventById.get(g.eventId)
    return {
      src: g.src,
      width: g.width,
      height: g.height,
      title: `${TIPOS[ev?.tipo ?? '']?.emoji ?? '📸'} ${ev?.nombre ?? ''}${ev?.fecha ? ` · ${formatFecha(ev.fecha)}` : ''}${ev?.lugar ? ` · ${ev.lugar}` : ''}`,
      description: [g.descripcion, ev?.descripcion].filter(Boolean).join('\n\n'),
    }
  })
  const nEventos = new Set(PHOTOS.map((p) => p.eventId)).size

  return (
    <div className="col" style={{ gap: 24 }}>
      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
        <div className="col grow" style={{ gap: 8 }}>
          <h1 style={{ fontSize: 64 }}>
            DSC en <span className="hl" style={{ background: 'var(--sun)', padding: '0 12px', border: 'var(--border)', borderRadius: 14, display: 'inline-block', transform: 'rotate(-2deg)' }}>acción</span> 📸
          </h1>
          <p style={{ margin: 0, fontSize: 22 }}>
            {nEventos} eventos y proyectos, {PHOTOS.length} recuerdos. Una comunidad que construye, aprende y comparte.
          </p>
        </div>
        <Mascot mood="point" size={150} className="bounce" />
      </div>

      {tipos.length > 1 && (
        <div className="row" style={{ gap: 10 }}>
          <button className={`btn sm ${filtro ? 'white' : ''}`} onClick={() => setFiltro(null)}>✨ Todo</button>
          {tipos.map((t) => (
            <button key={t} className="btn sm" style={{ background: filtro === t ? (TIPOS[t]?.color ?? 'var(--lime)') : 'white' }} onClick={() => setFiltro(filtro === t ? null : t)}>
              {TIPOS[t]?.emoji ?? '📸'} {TIPOS[t]?.label ?? t}
            </button>
          ))}
        </div>
      )}

      {!PHOTOS.length ? (
        <div className="center card" style={{ minHeight: 300 }}>
          <Mascot mood="think" size={130} />
          <h2 style={{ fontSize: 36 }}>Pronto llenaremos esta galería 📷</h2>
          <p className="muted" style={{ margin: 0 }}>Las fotos se agregan desde Pages CMS.</p>
        </div>
      ) : (
        <div className="gallery">
          <MasonryPhotoAlbum
            photos={album}
            columns={(w) => (w < 560 ? 2 : w < 900 ? 3 : 4)}
            spacing={20}
            onClick={({ index: i }) => setIndex(i)}
            render={{
              extras: (_, { photo }) => {
                const ev = eventById.get((photo as AlbumPhoto).g.eventId)
                return (
                  <span className="gallery-tag" style={{ background: TIPOS[ev?.tipo ?? '']?.color ?? 'white' }}>
                    {TIPOS[ev?.tipo ?? '']?.emoji ?? '📸'} {ev?.nombre}
                  </span>
                )
              },
            }}
          />
        </div>
      )}

      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={slides} plugins={[Captions]} captions={{ descriptionTextAlign: 'center', descriptionMaxLines: 6 }} />
    </div>
  )
}
