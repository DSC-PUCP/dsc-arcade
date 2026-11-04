# DSC Arcade — Documento de Alcance (v0.2)

> Developer Student Club PUCP · Actualizado: 2026-11-04 · Primer uso: stand en evento tecnológico (hoy)
> Cambios v0.2: respuestas del equipo incorporadas (modalidades, ruleta, QRs, identidad, despliegue).

## 1. Propósito

DSC Arcade es una aplicación web única y reutilizable para los stands de DSC PUCP. En lugar de regalar merch, el público **experimenta la tecnología** jugando minijuegos cortos con identidad DSC. Mensaje: *“En DSC no solo hablamos de tecnología; la construimos.”*

## 2. Objetivos

| # | Objetivo | Medición (v1, manual/local) |
|---|----------|-----------------------------|
| O1 | Atraer gente al stand | Partidas jugadas |
| O2 | Convertir en seguidores / comunidad | Escaneos de QR (IG, LinkedIn, WhatsApp) |
| O3 | Premios digitales a costo ~S/0 | Premios entregados (flores amarillas, insignias) |
| O4 | Base reutilizable para todos los eventos | Juegos y premios configurables sin tocar lógica |

## 3. Contexto de uso

- **Solo una laptop** (sin pantalla externa ni táctil). Interacción con mouse/trackpad y teclado. Legible a 1–2 m.
- 2 personas de DSC: una atrae, otra facilita (el “encargado”).
- Funciona **offline** una vez cargada; los QR se escanean con el celular del participante.
- Contenido **agnóstico al lugar**: sin referencias a PUCP en los juegos (sí en el branding DSC PUCP).

## 4. Alcance

### P0 · Imprescindible (v1, hoy)

1. **Hub / menú** con branding DSC, acceso a cada juego y a los QR de comunidad.
2. **Ruleta de premios**
   - Segmentos por defecto: 🌼 Flores amarillas · 🏅 Insignia · 🔁 Gira otra vez · 🎁 Premio sorpresa · 🍫 Chocolate.
   - Se gana el giro **superando el puntaje mínimo** de cada juego (umbral configurable por juego) o al ganar el Debug Challenge.
   - **Editable en el momento** por el encargado (agregar, quitar, renombrar, cambiar peso/probabilidad); se guarda en la laptop (localStorage) y se puede restaurar a los valores por defecto.
3. **Debug Challenge — “Fila India” (eliminación)**
   - El encargado ingresa N nombres; turnos rotativos.
   - Cada turno: snippet con **un** bug; **15 s** para hacer clic en la línea con el error. Feedback visual muy “juicy” (acierto, error, tiempo agotado, explicación del bug).
   - **1 pista por participante** por partida (resalta la zona aproximada del bug). Cantidad de pistas configurable en JSON.
   - Quien falla queda eliminado al cerrar la ronda (si **todos** fallan en una ronda, nadie sale). Gana el último en pie → giro de ruleta.
   - Si tras **4 rondas** (configurable) quedan varios, gana el de **menor tiempo acumulado** en respuestas correctas.
   - Dificultad progresiva por tiempo de partida: **muy fácil** (0–3 min) → **fácil** (3–5 min) → **medio** (5+ min). Lenguajes mezclados (Python, JavaScript, Java, C).
4. **Tech Speedrun — Mecanografía de código** (individual)
   - Escribir un código absurdo y gracioso (variables chistosas, programa tonto que se revela al final).
   - El encargado elige el texto (mismo texto para todos o variar) o deja que sea aleatorio.
   - Métricas: WPM neto, precisión, tiempo. **Leaderboard por sesión** (solo local en la laptop): el jugador deja su nombre al terminar → permite minicompetencias con premio al mejor puntaje. Reiniciable por el encargado.
5. **Adivina el Logo Tech** — logos de tecnologías de la era IA y el ecosistema moderno que se revelan progresivamente; opción múltiple; más puntos si aciertas antes.
6. **¿Verdadero o Alucinación?** — afirmaciones técnicas convincentes; decidir si son verdad o alucinación; explicación tras cada respuesta. Solo texto.
7. **Pantalla de premio**
   - Flores amarillas: QR/enlace a `https://dsc.inf.pucp.edu.pe/flores-amarillas/template` + aviso de que el encargado activará la plantilla (procedimiento interno documentado aparte).
   - Insignia digital personalizada (“Bug Hunter”, “Full Stack Legend”, …) con nombre y puntaje, **descargable como PNG**, con recordatorio visual al encargado para **enviarla al correo** del participante en el momento.
   - Premio sorpresa / chocolate: indicación para reclamar al encargado.
   - Siempre: QRs de comunidad (Instagram, LinkedIn, WhatsApp). Seguir redes **nunca** es requisito para jugar.
8. **Identidad visual** clara, dinámica y memorable basada en los colores del logo (ver [IDENTIDAD.md](IDENTIDAD.md)).
9. **Configuración en JSON** (`src/config/arcade.json`): juegos activos, umbrales, segundos por turno, pistas, rondas, segmentos por defecto, enlaces.

### P1 · Deseable (futuro, no exigible)

- **Envío de insignia por correo** desde la app (función serverless en Vercel).
- **Panel admin en tiempo de ejecución** (editar configuración, contenido, ruleta) protegido por clave en variable de entorno.
- **Leaderboard persistente** (Supabase / Turso u otro).
- Estadísticas de participación exportables.
- Soporte para pantalla externa / táctil en eventos grandes.

### P2 · Backlog

- Verdadero o Alucinación con imágenes · Terminal Challenge · Tech Meme Battle · Atrapa el Bug · leaderboard global multi-juego · “otra idea” del equipo (pendiente de análisis).

## 5. Flujos

**Individual (~1 min):** atracción → presentación DSC (10 s) → juego (30–60 s) → resultado → si supera el umbral: ruleta → premio → QRs de comunidad.

**Grupal (Debug Challenge, 2–5 min):** ingresar nombres → turnos de 15 s → eliminaciones por ronda → ganador → ruleta → premio.

## 6. Requisitos no funcionales

- Vite + React + TypeScript, build estático desplegado en **Vercel** (deja abierta la puerta a funciones serverless).
- Offline-first: fuentes, logos, snippets y QRs empaquetados.
- Sin datos personales persistidos fuera de la laptop; nombres solo en sesión/localStorage local.
- Contenido en archivos de datos editables (`src/data/*`).

## 7. Contenido v1

| Juego | Cantidad |
|-------|----------|
| Debug Challenge | ~30 snippets (3 niveles) |
| Speedrun | 6 textos |
| Adivina el Logo | ~30 logos |
| Verdadero o Alucinación | ~24 afirmaciones |
| Ruleta | 5 segmentos por defecto |

## 8. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Plazo de 1 día | P0 primero; contenido en datos para iterar rápido |
| Sin internet | Build offline; QRs como imágenes locales |
| Snippets difíciles | Rampa de dificultad + pista |
| Filas largas | Debug Challenge grupal |

## 9. Criterios de “listo para el stand”

- [ ] Los módulos P0 jugables de inicio a fin.
- [ ] Ruleta editable y persistente en la laptop.
- [ ] QRs reales insertados (IG, LinkedIn, WhatsApp, flores amarillas).
- [ ] Funciona sin internet tras la primera carga (o con `npm run preview` local).
- [ ] Probado por 2 personas del equipo.
