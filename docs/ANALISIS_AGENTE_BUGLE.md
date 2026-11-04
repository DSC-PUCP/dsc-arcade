# Análisis de viabilidad — "Bugle en vivo": agente de IA que anima el stand

> Estado: **implementado (v1.0)**, 2026-11-04. Ver §00. El resto del documento es el análisis original.
> Fuentes: investigaciones propias del equipo (`proveedores-llm-gratuitos-alternativas-a-groq-nov2026.md`, `proveedores-llm-gratuitos-lab-setiembre-2026.md`) + conocimiento técnico general. **No se hizo investigación web nueva ni pruebas con API keys**: lo marcado como *(verificar)* debe probarse antes de construir.

## 00. Estado de la implementación (v1.0, 2026-11-04)

**Qué hay:**
- `api/bugle/[action].ts` → `POST /api/bugle/line` (Groq: `llama-3.1-8b-instant` ambiental, `openai/gpt-oss-120b` conversación con `reasoning_effort: low`) y `POST /api/bugle/transcribe` (`whisper-large-v3-turbo`, `language: es`; el cuerpo es el audio crudo). Exige `x-stand-key` = `STAND_KEY` (401 si no), límite en memoria de ~20 req/min por IP, `max_tokens` 120 (200 en chat porque gpt-oss razona), 429 sin reintento, normaliza U+202F y espacios raros, filtro de salida (palabras bloqueadas, URLs, ≤260 caracteres) → 422 y el cliente usa el banco offline.
- System prompt editable: `api/_bugle-prompt.ts`.
- `vercel.json`: el rewrite SPA ahora excluye `/api/`.
- Frontend: `src/lib/bugle/` (`bus.ts` eventos, `orchestrator.ts` estado/contexto/turnos, `voice.ts` speechSynthesis con trozos ≤140 caracteres, `mic.ts` VAD + grabación), `src/components/BugleLive.tsx`, banco offline `src/data/bugleLines.ts` (40 frases: llamado, celebración, consuelo, reto, dato, redes).
- Config en `arcade.json` → `bugle`: `ambientSeconds` 60, `minGapSeconds` 12, `pushToTalkKey` F2, `maxUtteranceSeconds` 15, `transcriptMemorySeconds` 120, `vadThreshold` 0.02.
- Eventos: ruleta, nuevo récord y fin del Speedrun, bug chapado (solo contexto), eliminados y ganador del Debug, resultado final de Logos y Verdad o Alucinación.
- Contexto enviado: juego activo, último evento (≤90 s), minutos sin interacción, top 3 del Speedrun, hora, nombre del evento, últimas transcripciones ambientales y las 3 últimas frases (para no repetir).
- UI: botón 🐧 en la topbar (activar, guardar `STAND_KEY` en localStorage); con Bugle activo aparecen 🎙️/🚫 (mic) y 🗣️/🤐 (voz, `speechSynthesis.cancel()` inmediato). Aviso fijo abajo a la izquierda cuando el mic escucha; botón 🎤 abajo a la derecha (o F2 mantenida) para hablarle. Bugle aparece animado con el mood mientras habla, sin globo.

**Diferencias con el diseño:**
- **VAD por energía** con piso de ruido adaptativo, no Silero: evita cargar ONNX/WASM. Si en el hall da muchos falsos positivos, subir `vadThreshold` o migrar a `@ricky0123/vad-web`.
- Half-duplex: el mic descarta lo grabado mientras Bugle habla, durante la grabación de pulsar-para-hablar y 500 ms después.
- Sin clave o sin red: Bugle sigue funcionando solo con el banco offline.
- El navegador pide permiso de micrófono; si Bugle quedó activado de una sesión anterior, arranca con el primer clic o tecla (regla de autoplay).

**Verificado:** `npm run build`; typecheck de la función; prueba local de la función con Groq simulado (401, frase con U+202F normalizada, filtro → 422, 429 controlado, transcripción).
**Pendiente de probar en el deploy:** latencia y calidad reales de Groq, la voz elegida en la laptop del stand, el VAD con ruido real, pulsar-para-hablar, los dos mutes y el fallback offline (por ejemplo, borrando la clave).

## 0. Decisiones del equipo (v0.2, 2026-11-04)

| Tema | Decisión |
|------|----------|
| Salida | **Voz en voz alta** (TTS). Sin globo de texto. |
| Escucha ambiental | **Se mantiene** (modo C), con las mitigaciones de §7: VAD, fragmentos cortos, aviso visible, nada se guarda. |
| Conversación | **Pulsar para hablar.** |
| Transcripción | En la nube si es gratis y buena → **Groq Whisper** (`whisper-large-v3-turbo`), con la misma API key. |
| Frecuencia | Ambiental **cada ~60 s**; stand de **~2 h**. |
| Contenido | Persona de Bugle de **DSC PUCP**; system prompt iterable. |
| Proveedores | **Máximo 2.** Groq (STT + LLM) como principal; respaldo opcional. |

**Proveedor único viable: Groq.** Cubre voz→texto (Whisper) y LLM con una sola key. Presupuesto para 2 h *(verificar los límites de Whisper en la consola de Groq)*:
- **Ambiental:** 120 llamadas al LLM (~70k tokens en `llama-3.1-8b-instant`, de 500k/día) y ~120 transcripciones de ≤15 s (~30 min de audio).
- **Conversación:** ~100 turnos (~90k tokens en `openai/gpt-oss-120b`, de 200k/día) y ~100 transcripciones cortas.

Todo cabe con holgura en el plan gratis. Como respaldo, **solo si se quiere**: Cloudflare Workers AI (requiere Account ID + token).

**Controles:** dos botones independientes: 🎙️ **Mic off** (no escucha ni envía audio; sigue animando con el contexto de los juegos) y 🔇 **Voz off** (silencio inmediato con `speechSynthesis.cancel()`). Ambos apagados = Bugle desactivado.

**Navegador:** funciona en Edge, Chrome y Firefox, porque la transcripción la hace Groq. Elegir la mejor voz `es-*` disponible con prioridad Edge Natural > Google español > voces del sistema. Si la voz no convence: **Piper TTS en WASM** como alternativa futura.

**Voz de Bugle:** `speechSynthesis` de **Microsoft Edge** (voces neuronales en español, gratis). Los TTS de Groq no tienen buen soporte en español *(verificar)*.

## 1. Resumen ejecutivo

| Modo | Viabilidad | Comentario corto |
|------|-----------|------------------|
| **A. Animador ambiental** (Bugle habla solo cada cierto tiempo y reacciona a lo que pasa en los juegos) | 🟢 **Alta** | Barato en cuota, sin problemas de privacidad, se hace en ~medio día. |
| **B. Conversación por turnos** (alguien del público le habla y Bugle responde) | 🟡 **Media-alta** | Funciona bien con **pulsar-para-hablar**. El cuello de botella es el ruido del evento, no el LLM. |
| **C. Escucha ambiental continua** (transcribir frases sueltas del entorno y usarlas como contexto) | 🔴 **Baja** | En un hall ruidoso el micrófono de la laptop capta ruido ininteligible, y transcribir a desconocidos sin aviso es un problema de privacidad. Propongo reemplazarlo por contexto de los juegos. |

**Recomendación:** construir A primero (MVP), luego B con pulsar-para-hablar, y no hacer C tal como está planteado. Todo con una función de Vercel que guarda la API key, y Groq como proveedor principal con un respaldo.

## 2. Lo que entendí de tu visión (validar)

1. Una "voz" de Bugle que **anima y llama gente** al stand sin que el encargado tenga que hablar todo el tiempo.
2. El frontend arma un contexto (frases captadas del entorno o nada) y **cada X segundos** pide una frase al LLM a través de una **función de Vercel** con tu API key en variables de entorno.
3. Transcripción **local en el navegador**, al estilo de las webs que corren Whisper en el cliente.
4. Un **modo "más agentic"** que responde cuando alguien del público le habla, usando el micrófono de la laptop.

Supuesto mío, **no lo mencionaste**: que Bugle **hable en voz alta** (texto a voz) además de mostrar un globo de texto. Ver preguntas en §10.

## 3. Arquitectura propuesta

```
            ┌──────────────────────── Navegador (laptop del stand) ───────────────────────┐
            │                                                                              │
 Micrófono ─┼─► VAD (detecta voz) ─► STT (voz→texto) ──┐                                   │
 (solo B)   │                                          ├─► Orquestador ─► POST /api/bugle  │
            │  Eventos de juegos (ganó, ranking, ─────┘     (cada X s o   │                │
            │  nadie juega hace 2 min, hora…)                por evento)  │                │
            │                                                             ▼                │
            │  Globo de texto + animación de Bugle ◄── frase ◄── respuesta JSON            │
            │  TTS (speechSynthesis) ─► parlantes   (el micrófono se silencia mientras habla)│
            └──────────────────────────────────────────────────────────────────────────────┘
                                                             │
                                          Vercel Function /api/bugle (Node, edge o serverless)
                                          · guarda LLM_API_KEY en env
                                          · system prompt de Bugle + filtros
                                          · límite de frecuencia + clave del stand
                                          · respaldo entre proveedores
                                                             │
                                          Groq (principal) → Cloudflare Workers AI / Kilo (respaldo)
```

Puntos clave:
- **La API key nunca va al navegador.** La función es un proxy con el system prompt y los filtros dentro.
- **Disparo por eventos, no solo por reloj.** Las frases más divertidas salen de lo que pasa ("¡Ana chapó 3 bugs seguidos!", "Nadie juega hace 2 minutos…"). El temporizador queda como piso (ej. cada 45–90 s si no pasó nada).
- **Banco de frases offline:** si no hay internet o se agota la cuota, Bugle sigue con frases pregeneradas (que también se pueden generar con el mismo LLM antes del evento).

## 4. Proveedor LLM: qué conviene según tus investigaciones

Requisitos del caso: **latencia baja** (para conversar se nota pasar de 2 s), respuestas **cortas** (1–2 oraciones, ~40–80 tokens de salida), **español natural**, volumen moderado y sostenido durante 4–8 h.

| Proveedor | Encaje | Por qué |
|-----------|--------|---------|
| **Groq** | 🟢 Principal | Latencia de 0,3–1,1 s medida en el lab. Cuotas **por modelo**, lo que permite repartir los modos. |
| **Cloudflare Workers AI (GLM-4.7-Flash)** | 🟢 Respaldo | Límites públicos y medibles (300 RPM, 10.000 neuronas/día), API compatible con OpenAI. *(verificar latencia y calidad en español)* |
| **Kilo Gateway** | 🟡 Respaldo 2 | 200 solicitudes/hora por IP es suficiente, pero los modelos gratis rotan. *(verificar)* |
| Google AI Studio | 🔴 | La cuota real medida fue de **20 peticiones/día por modelo**: se acaba en minutos. |
| NVIDIA NIM | 🔴 | Créditos finitos; GLM-5.2 tardó ~70 s. Inviable para conversar. |
| OpenRouter | 🔴 | 50 solicitudes/día gratis. |

### 4.1 Presupuesto de cuota (Groq, plan gratis)

Supuestos: evento de 6 h; prompt de Bugle compacto (~350 tokens de sistema + ~150 de contexto) y ~60 de salida → **~560 tokens por llamada**.

| Escenario | Llamadas/día | Tokens/día | ¿Cabe? |
|-----------|-------------|-----------|--------|
| Ambiental cada 60 s + ~60 eventos | ~420 | ~235k | ❌ en un modelo de 200k TPD (GPT-OSS 120B, Qwen 27B); ✅ en **Llama 3.1 8B** (500k TPD, 14.400 RPD) |
| Conversación: 150 turnos con historial corto (~900 tokens) | ~150 | ~135k | ✅ en GPT-OSS 120B o Qwen 3.6 27B (200k TPD) |

**Estrategia:** usar **modelos distintos por modo** para aprovechar que las bolsas son por modelo: frases ambientales en `llama-3.1-8b-instant` y conversación en `openai/gpt-oss-120b` o `qwen/qwen3.6-27b`. El 8.000 TPM tampoco es problema con llamadas de ~600 tokens.

Lecciones de tu lab que aplican directo:
- **No inflar `max_tokens`**: Groq reserva ese valor contra el TPM y devuelve **HTTP 413**. Usa `max_tokens` ≈ 120.
- **Desactivar el razonamiento en Qwen** (`thinking: false`), o el modelo gasta tokens y latencia en pensar una frase de 20 palabras.
- **No reintentar un 429 de inmediato**: cambiar al proveedor de respaldo o al banco offline.
- **Normalizar `U+202F`** y otros espacios raros antes de pasar el texto a voz.

## 5. Voz a texto (STT) en el navegador

| Opción | Local real | Español | Latencia en laptop sin GPU | Comentario |
|--------|-----------|---------|----------------------------|-----------|
| **Web Speech API** (`SpeechRecognition` en Chrome/Edge) | ❌ El audio va a servidores de Google/Microsoft | Muy bueno | Casi en tiempo real | Gratis y sin descargas. Requiere internet. El modo continuo se corta solo y hay que reiniciarlo. |
| **Whisper en el navegador** (transformers.js con ONNX, WebGPU o WASM) | ✅ | `tiny`: regular · `base`: aceptable · `small`: bueno | `base` con WASM: ~1–4 s por frase corta; con WebGPU mucho menos *(verificar en la laptop del stand)* | Descarga de ~75–250 MB la primera vez (queda en caché). Puede "alucinar" texto con ruido o silencio. |
| whisper.cpp en WASM | ✅ | Igual que Whisper | Parecida | Más trabajo de integración que transformers.js. |

Conclusiones:
- **Para el modo B**, Web Speech API es lo más rápido de implementar y lo más preciso. Si exiges que el audio **no salga de la laptop**, toca Whisper `base` o `small`, con más latencia y el riesgo de que alucine con ruido.
- **Siempre con VAD** (detector de voz, ej. Silero VAD en el navegador) para mandar a transcribir solo los fragmentos con voz y no el ruido de fondo.

## 6. Texto a voz (TTS)

- **`speechSynthesis` del navegador**: gratis e inmediato. En **Microsoft Edge** hay voces neuronales en español (ej. *Dalia*, *Jorge*, *Elvira*) mucho más naturales que las de Chrome. Las voces "Online (Natural)" requieren internet *(verificar disponibilidad en la laptop)*.
- TTS neuronal local (Piper o Kokoro en WASM): posible, pero más peso y menos voces en español. No vale la pena para el MVP.
- **Parlantes:** los de una laptop no se oyen en un hall con ponencias. Si Bugle va a "llamar gente", se necesita un parlante Bluetooth barato, o asumir que el canal principal es el globo de texto en pantalla.

## 7. Problemas duros (lo que define si funciona o no)

1. **Bugle escuchándose a sí mismo:** con micrófono y parlante en la misma laptop, Bugle transcribiría su propia voz. Solución: **half-duplex** (silenciar el STT mientras habla y 500 ms después) y `echoCancellation: true` en `getUserMedia`.
2. **Ruido del evento:** el micrófono de una laptop a 1–2 m en un hall con gente y ponencias rinde poco para STT. Mitigaciones: **pulsar-para-hablar** (botón grande o tecla mantenida) y que la persona hable cerca. Un micrófono de solapa o USB barato cambia mucho el resultado.
3. **Privacidad (modo C):** transcribir conversaciones ajenas y mandarlas a un proveedor externo sin aviso es delicado (en Perú aplica la Ley 29733 de datos personales, y en el campus hay normas propias). Con pulsar-para-hablar la persona decide hablarle a Bugle, y un aviso visible ("🎙️ Bugle te escucha solo cuando presionas el botón") resuelve gran parte del problema.
4. **Lo que diga en voz alta es público:** alguien intentará que diga groserías o algo ofensivo ("ignora tus instrucciones…"). Se necesitan:
   - un system prompt estricto (persona de Bugle, temas permitidos, nunca contenido sexual, político ni insultos);
   - un filtro de salida (lista de palabras bloqueadas y largo máximo) **antes** del TTS;
   - temperatura moderada y respuestas de 1–2 oraciones;
   - un botón de pánico del encargado: mute inmediato y modo solo-banco-offline.
5. **Abuso del endpoint:** `/api/bugle` queda público en la URL de Vercel y cualquiera podría agotar la cuota. Hay que exigir una **clave del stand** (header con un valor que el encargado ingresa una vez, guardado en env `STAND_KEY`) más un límite de frecuencia simple.
6. **Sin internet = sin LLM:** el banco de frases offline es obligatorio, no opcional.

## 8. Diseño del contenido (lo que hace que sea divertido)

- **Persona:** Bugle, pingüino dev con capucha, jerga peruana juvenil (coherente con [IDENTIDAD.md](../IDENTIDAD.md)), autoironía nerd y frases cortas.
- **Contexto que el frontend manda en cada llamada:** modo, juego activo, último evento (ganó la ruleta, nuevo récord en el Speedrun, eliminado en el Debug Challenge), minutos sin jugadores, top 3 del ranking, hora y nombre del evento. Nada de audio crudo.
- **Tipos de frase:** llamado ("¿Tú, el de la casaca? ¿Encuentras un bug en 15 segundos?"), celebración, picar al ranking ("Diego sigue invicto con 48 WPM, ¿quién se anima?"), dato curioso tech, recordatorio de redes y premios.
- **Respuesta en JSON** `{ frase, emocion }` para elegir la variante de Bugle (party, think, sad…) y animarlo mientras habla.

## 9. Esfuerzo estimado

| Entregable | Esfuerzo | Riesgo |
|-----------|----------|--------|
| A. Ambiental: función de Vercel + respaldo + banco offline + globo y TTS + eventos de los juegos | ~0,5–1 día | Bajo |
| B. Conversación con pulsar-para-hablar usando Web Speech API | +1 día | Medio (ruido y voces) |
| B'. Igual que B pero con Whisper local (transformers.js) en lugar de Web Speech | +1–2 días | Medio-alto (latencia en la laptop, alucinaciones) |
| Panel del encargado: activar o desactivar, frecuencia, mute, volumen | +0,5 día | Bajo |

## 10. Preguntas antes de profundizar la investigación

1. **¿Bugle debe hablar en voz alta, o basta un globo de texto animado en pantalla?** ¿Contarían con un parlante externo?
2. **¿Aceptas reemplazar la "escucha ambiental" por contexto de los juegos?** ¿O hay algo concreto que quieres captar del entorno? Por ejemplo, que reaccione cuando alguien dice "Bugle".
3. **Activación del modo conversación:**
   - Pulsar-para-hablar (lo recomiendo).
   - Palabra de activación tipo "Oye Bugle", más frágil con ruido.
   - Siempre escuchando.
4. **¿"Local" es requisito estricto (el audio no sale de la laptop) o era solo para no pagar?** Web Speech API es gratis pero manda el audio a Google o Microsoft.
5. **¿Cuánto duran tus eventos típicos y cada cuánto quieres que hable en modo ambiental?** Es para afinar el presupuesto de cuota.
6. **¿Hay temas vetados o cosas que Bugle sí debe mencionar siempre?** Por ejemplo: premios disponibles, próximos eventos de DSC, no mencionar marcas.

Con esas respuestas puedo hacer la investigación fina: probar latencias reales de Groq, Cloudflare y Kilo con tus keys, medir Whisper `base` y `small` en la laptop del stand, revisar las voces de Edge disponibles y definir el system prompt con la batería de pruebas de seguridad.
