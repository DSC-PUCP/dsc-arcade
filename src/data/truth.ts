/** ¿Verdadero o Alucinación? truth = true → es verdad; false → alucinación. */
export interface Statement { text: string; truth: boolean; why: string }

export const STATEMENTS: Statement[] = [
  { truth: true, text: 'Python se llama así por el grupo de comedia Monty Python, no por la serpiente.', why: 'Guido van Rossum era fan de “Monty Python’s Flying Circus”.' },
  { truth: true, text: 'El primer “bug” documentado fue una polilla real atrapada en la computadora Harvard Mark II en 1947.', why: 'El equipo de Grace Hopper pegó la polilla en la bitácora: “first actual case of bug being found”.' },
  { truth: true, text: 'La primera versión de JavaScript se creó en unos 10 días en 1995.', why: 'Brendan Eich la prototipó en Netscape en mayo de 1995.' },
  { truth: true, text: 'En JavaScript, typeof null devuelve "object".', why: 'Es un error histórico del lenguaje que se mantuvo por compatibilidad.' },
  { truth: true, text: 'Git fue creado por Linus Torvalds, el mismo creador de Linux.', why: 'Lo creó en 2005 para gestionar el desarrollo del kernel de Linux.' },
  { truth: true, text: 'En Python, 0.1 + 0.2 == 0.3 devuelve False.', why: 'Por la representación en punto flotante: 0.1 + 0.2 = 0.30000000000000004.' },
  { truth: true, text: 'Los LLM generan texto prediciendo el siguiente token, no copiando respuestas de una base de datos.', why: 'Calculan probabilidades del siguiente token según el contexto.' },
  { truth: true, text: 'La “ventana de contexto” de un LLM es la cantidad máxima de tokens que puede considerar a la vez.', why: 'Incluye tu prompt, el historial y la respuesta que va generando.' },
  { truth: true, text: 'El código HTTP 418 “I’m a teapot” nació como broma del April Fools’ Day en un RFC.', why: 'RFC 2324 (1998): el protocolo para controlar cafeteras.' },
  { truth: true, text: 'En JavaScript, [] + [] da como resultado un string vacío.', why: 'Ambos arrays se convierten a "" y se concatenan.' },
  { truth: true, text: 'MCP (Model Context Protocol) es un estándar abierto presentado por Anthropic para conectar modelos de IA con herramientas y datos.', why: 'Se anunció en noviembre de 2024 y lo adoptaron muchas herramientas.' },
  { truth: true, text: 'RAG combina un modelo de lenguaje con la búsqueda de documentos externos para responder con información actualizada.', why: 'Retrieval-Augmented Generation: primero recupera, luego genera.' },

  { truth: false, text: 'Python 4.0 eliminó la indentación obligatoria y ahora usa llaves {} como C.', why: 'No existe Python 4.0, y la indentación sigue siendo parte de la sintaxis.' },
  { truth: false, text: 'La arquitectura “Transformer” se llama así porque el primer modelo se entrenó con guiones de la película Transformers.', why: 'Viene del paper “Attention Is All You Need” (2017): transforma secuencias con atención.' },
  { truth: false, text: 'Desde HTML5, HTML es Turing-completo y puedes hacer bucles con la etiqueta <loop>.', why: 'HTML es un lenguaje de marcado; <loop> no existe.' },
  { truth: false, text: '“git push --force” siempre es seguro porque GitHub guarda automáticamente un respaldo de lo que sobrescribes.', why: 'Puedes borrar el trabajo de otros en la rama remota. Usa --force-with-lease, con cuidado.' },
  { truth: false, text: 'JSON significa “Java Serialized Object Notation” porque fue creado como parte de Java.', why: 'Significa JavaScript Object Notation.' },
  { truth: false, text: 'Todos los LLM navegan internet en tiempo real mientras generan cada palabra.', why: 'Por defecto usan lo aprendido en su entrenamiento; buscar en la web requiere herramientas extra.' },
  { truth: false, text: '“sudo” significa “Super User DO-it-now” y ejecuta el comando con prioridad máxima de CPU.', why: 'Es “superuser do”: da permisos elevados, no más prioridad de CPU.' },
  { truth: false, text: 'La “temperatura” de un LLM controla cuántas GPUs se usan: a más temperatura, responde más rápido.', why: 'La temperatura controla la aleatoriedad al elegir tokens, no el hardware.' },
  { truth: false, text: 'Linux se llama así porque Linus lo bautizó en honor a su gato Lin.', why: 'Viene de “Linus” + “Unix”. Y la mascota es un pingüino: Tux.' },
  { truth: false, text: 'En SQL, un DELETE sin WHERE solo borra la primera fila de la tabla, por seguridad.', why: 'Borra TODAS las filas. Error clásico 💀.' },
  { truth: false, text: 'En un LLM, un token siempre equivale exactamente a una palabra completa.', why: 'Un token puede ser una palabra, parte de una palabra o un símbolo.' },
  { truth: false, text: 'CSS fue inventado por Google en 2010 para reemplazar el diseño con tablas.', why: 'Lo propuso Håkon Wium Lie en 1994 y la primera especificación es de 1996.' },
]
