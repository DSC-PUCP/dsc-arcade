# DSC Arcade — Identidad visual

## Concepto: **“Sticker Pop”**

Un patio de juegos luminoso. Todo parece un **sticker** pegado en la laptop de un developer: piezas blancas con contorno azul tinta grueso, sombras duras desplazadas y colores vivos del logo. Las cosas **rebotan, se aprietan y celebran**. Claro, rápido de leer a distancia y distinto al típico “hacker retro”.

Motivo gráfico: la **barra diagonal `/`** del logo `</dsc>` — aparece como franjas verdes inclinadas en fondos, separadores y transiciones.

Mascota: **Bugle**, el pingüino dev oficial de DSC PUCP (capucha oscura + correas cruzadas tipo militar, pico naranja). En el arcade aparece en versión **amigable y expresiva**, con contorno tinta para encajar con el estilo sticker: celebra cuando aciertas y se lamenta cuando fallas. Variantes y prompts en [BUGLE_PROMPTS.md](BUGLE_PROMPTS.md); referencias en `media/bugle/`.

## Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `--ink` | `#2B2670` | Texto, contornos, sombras duras |
| `--indigo` | `#3F3797` | Azul del logo (“PUCP”), botones secundarios |
| `--green` | `#64C462` | Verde principal del logo |
| `--lime` | `#7BE36F` | Verde claro / barra `/`, acentos y éxito |
| `--mint` | `#E9F9E7` | Fondos suaves |
| `--paper` | `#FFFFFF` | Superficies |
| `--sun` | `#FFD23F` | Premios, flores amarillas, destacados |
| `--coral` | `#FF6B6B` | Error, eliminación, tiempo agotado |
| `--lilac` | `#B9B3FF` | Acento secundario, pistas |

Regla 60/30/10: blanco/mint 60 · tinta/indigo 30 · verde/sol/coral 10.

## Tipografía

- **Bricolage Grotesque** (800) — títulos grandes y números. Personalidad juguetona.
- **Nunito** — textos e interfaz, redondeada y amable.
- **JetBrains Mono** — código.

Tamaños pensados para 1–2 m: cuerpo ≥ 20 px, títulos 48–96 px, código 20–24 px.

## Forma y movimiento

- Bordes de 3 px `--ink`, radio 20 px, sombra dura `6px 6px 0 var(--ink)`.
- Botones: al presionar se “hunden” (la sombra desaparece y el botón baja).
- Animaciones con rebote (spring) para entradas; sacudida para errores; confetti y pop para aciertos.
- Fondo: mint con grilla de puntos sutil y franjas `/` animadas lentamente.

## Voz

Español informal, divertido y juvenil, con jerga peruana, y siendo agnóstico al lugar: “¡Bug chapado!”, “Uy, ese bug se escapó”, “Girando y farmeando aura…”.
