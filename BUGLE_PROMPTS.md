# Bugle — variantes para DSC Arcade (prompts para Gemini)

**Cómo usar:** en Gemini adjunta **siempre** la imagen original (`media/bugle/bugle-original-ref.webp`) y pega el **bloque base** + el prompt de la variante. Guarda cada resultado como PNG con el nombre indicado en `public/mascot/`. La app los toma automáticamente; si falta alguno, usa `bugle-happy.png` y, si tampoco está, un dibujo de respaldo.

> Si Gemini no entrega fondo transparente, pide fondo **blanco puro liso** y pásame los PNG: yo les quito el fondo.

## Bloque base (pegar antes de cada variante)

```
Usa al personaje de la imagen adjunta: Bugle, un pingüino con capucha oscura tipo capa y correas negras cruzadas sobre el pecho con una bolsita táctica, pico naranja. Mantén esos rasgos de identidad (pingüino, capucha, correas cruzadas tipo militar).
Estilo: ilustración cartoon amigable y expresiva tipo sticker, ojos grandes y brillantes, proporciones redondeadas y tiernas (cabeza un poco más grande), contorno grueso color azul tinta #2B2670, colores planos con sombreado suave. Paleta de acentos: verde #64C462 / #7BE36F, amarillo #FFD23F, lila #B9B3FF. Cuerpo completo, centrado, sin texto, sin marco, sin sombra en el piso.
Fondo transparente (si no es posible: blanco puro #FFFFFF liso). Formato cuadrado 1024x1024 PNG.
```

## Variantes (prioridad de arriba a abajo)

| # | Archivo | Dónde aparece | Prompt de la variante |
|---|---------|---------------|-----------------------|
| 1 | `bugle-happy.png` | Portada (grande), resultados normales | Bugle sonriendo con el pico abierto, saludando con una aleta levantada, postura alegre y confiada. |
| 2 | `bugle-party.png` | Ganador del Debug Challenge, insignia, ruleta ganada | Bugle celebrando a lo grande: salta con ambas aletas arriba, ojos cerrados de felicidad, rodeado de confetti verde, amarillo y lila. |
| 3 | `bugle-sad.png` | Falla un bug / respuesta incorrecta | Bugle con cara de "uy, fallé" cómica: se agarra la capucha con una aleta, ojos en espiral o lagrimita exagerada, gota de sudor; tierno, no trágico. |
| 4 | `bugle-think.png` | Inicio del Debug Challenge y de Verdad o Alucinación | Bugle pensativo con una aleta en la barbilla y la otra sosteniendo una lupa, una ceja levantada, signo de pregunta flotando. |
| 5 | `bugle-typing.png` | Tech Speedrun | Bugle tecleando a toda velocidad en una laptop pequeña, aletas borrosas por la velocidad, audífonos verdes puestos sobre la capucha, expresión concentrada y divertida. |
| 6 | `bugle-detective.png` | Adivina el Logo | Bugle en modo detective: mira por una lupa grande hacia el espectador, el ojo se ve enorme a través del lente, sonrisa pícara. |
| 7 | `bugle-point.png` | Ruleta de premios | Bugle señalando hacia un lado con una aleta (como presentando algo), guiñando un ojo, postura de presentador. |
| 8 | `bugle-gift.png` | Pantallas de premio (sorpresa, chocolate, flores) | Bugle sosteniendo con ambas aletas una caja de regalo amarilla con lazo verde, ofreciéndola con entusiasmo. |

## Extras opcionales (si sobra tiempo)

- `bugle-peek.png`: Bugle asomándose desde el borde inferior, solo cabeza y aletas. Para las esquinas de la pantalla.
- `bugle-bug.png`: Bugle atrapando un bichito verde con una red. Para la tarjeta del Debug Challenge.
