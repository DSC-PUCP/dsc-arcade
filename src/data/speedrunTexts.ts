/** Textos para Tech Speedrun. Solo ASCII para evitar teclas muertas (tildes). La indentación se salta sola. */
export interface SpeedText {
  id: string
  title: string
  lang: string
  code: string
}

export const SPEED_TEXTS: SpeedText[] = [
  {
    id: 'lunes',
    title: 'Detector de lunes',
    lang: 'JavaScript',
    code: `function esLunes(hoy) {
  const cafes = 0;
  if (hoy === "lunes") {
    return "Necesitas " + (cafes + 3) + " cafes";
  }
  return "Sobreviviste, campeon";
}`,
  },
  {
    id: 'excusas',
    title: 'Generador de excusas',
    lang: 'Python',
    code: `def excusa_para_no_entregar(dias_restantes):
    gato_hacker = True
    if dias_restantes < 1 and gato_hacker:
        return "Mi gato borro el repo"
    return "Ya casi, solo falta un commit"`,
  },
  {
    id: 'almuerzo',
    title: 'Algoritmo del almuerzo',
    lang: 'Python',
    code: `menu = ["pizza", "pizza fria", "mas pizza"]
hambre_nivel = 9001
for plato in menu:
    if hambre_nivel > 9000:
        print("Es mas de 9000!")
    print("Hoy comemos", plato)`,
  },
  {
    id: 'password',
    title: 'Contrasena ultra segura',
    lang: 'JavaScript',
    code: `const contrasenaSegura = () => {
  const ideas = ["123456", "password", "qwerty"];
  const elegida = ideas[0];
  console.log("Nadie adivinara: " + elegida);
  return elegida;
};`,
  },
  {
    id: 'ia',
    title: 'Inteligencia artificial avanzada',
    lang: 'Python',
    code: `def inteligencia_artificial(pregunta):
    if "?" in pregunta:
        return "Depende"
    return "Interesante, cuentame mas"

print(inteligencia_artificial("Aprobare el curso?"))`,
  },
  {
    id: 'viernes',
    title: 'Deploy un viernes',
    lang: 'JavaScript',
    code: `const hoy = new Date().getDay();
const valentia = hoy === 5 ? 100 : 0;
if (valentia > 99) {
  deployAProduccion();
  rezar();
  apagarCelular();
}`,
  },
]
