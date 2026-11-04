/**
 * Snippets para el Debug Challenge.
 * Marca la línea con el bug agregando "  @@" al final. La pista resalta una zona de ~3 líneas que la contiene.
 * level: 1 = muy fácil, 2 = fácil, 3 = medio.
 */
export interface Snippet {
  id: string
  lang: 'Python' | 'JavaScript' | 'Java' | 'C'
  level: 1 | 2 | 3
  code: string
  why: string
}

export interface ParsedSnippet extends Snippet {
  lines: string[]
  bug: number
}

export const SNIPPETS: Snippet[] = [
  // ---------- Nivel 1: muy fácil ----------
  { id: 'py-typo', lang: 'Python', level: 1, why: 'Se retorna "mensage" pero la variable se llama "mensaje".', code: `def saludar(nombre):
    mensaje = "Hola, " + nombre
    return mensage  @@
print(saludar("Ada"))` },
  { id: 'js-lte', lang: 'JavaScript', level: 1, why: 'Con <= se lee frutas[3], que no existe. Debe ser <.', code: `const frutas = ["mango", "piña", "uva"];
for (let i = 0; i <= frutas.length; i++) {  @@
  console.log(frutas[i]);
}` },
  { id: 'py-total', lang: 'Python', level: 1, why: 'El total es precio × cantidad, no precio + cantidad.', code: `precio = 20
cantidad = 3
total = precio + cantidad  @@
print("Total a pagar:", total)` },
  { id: 'js-par', lang: 'JavaScript', level: 1, why: 'Un número par tiene residuo 0, no 1.', code: `function esPar(n) {
  return n % 2 === 1;  @@
}
console.log(esPar(4)); // esperado: true` },
  { id: 'py-prom', lang: 'Python', level: 1, why: 'Hay 4 notas: se debe dividir entre len(notas), no entre 3.', code: `notas = [15, 18, 12, 20]
promedio = sum(notas) / 3  @@
print("Promedio:", promedio)` },
  { id: 'java-semi', lang: 'Java', level: 1, why: 'Falta el punto y coma al final de la instrucción.', code: `public class Hola {
  public static void main(String[] args) {
    System.out.println("Hola mundo")  @@
  }
}` },
  { id: 'py-args', lang: 'Python', level: 1, why: 'La función necesita base y altura, pero solo se pasa un argumento.', code: `def area_rectangulo(base, altura):
    return base * altura

print(area_rectangulo(5))  @@` },
  { id: 'js-inc', lang: 'JavaScript', level: 1, why: 'contador + 1 calcula pero no guarda. Debe ser contador += 1.', code: `let contador = 0;
contador + 1;  @@
console.log(contador); // esperado: 1` },
  { id: 'c-undeclared', lang: 'C', level: 1, why: 'La variable "y" no existe; la variable declarada es "x".', code: `#include <stdio.h>
int main() {
  int x = 10;
  printf("x vale %d\\n", y);  @@
  return 0;
}` },
  { id: 'py-range', lang: 'Python', level: 1, why: 'range(1, 5) llega hasta 4. Para incluir el 5 debe ser range(1, 6).', code: `# Debe imprimir del 1 al 5
for i in range(1, 5):  @@
    print(i)` },
  { id: 'js-prop', lang: 'JavaScript', level: 1, why: 'La propiedad se llama "nombre", no "name".', code: `const usuario = { nombre: "Grace", edad: 30 };
console.log("Nombre: " + usuario.name);  @@` },
  { id: 'py-colon', lang: 'Python', level: 1, why: 'Al if le faltan los dos puntos ":".', code: `temperatura = 35
if temperatura > 30  @@
    print("¡Qué calor!")` },

  // ---------- Nivel 2: fácil ----------
  { id: 'py-max', lang: 'Python', level: 2, why: 'Si todos son negativos, empezar en 0 hace que nunca se actualice. Debe iniciar con lista[0].', code: `def maximo(lista):
    mayor = 0  @@
    for x in lista:
        if x > mayor:
            mayor = x
    return mayor

print(maximo([-5, -2, -9]))  # esperado: -2` },
  { id: 'js-return', lang: 'JavaScript', level: 2, why: 'Falta "return": la función devuelve undefined.', code: `function sumar(a, b) {
  const resultado = a + b;
  resultado;  @@
}
console.log(sumar(2, 3)); // undefined 😱` },
  { id: 'py-index', lang: 'Python', level: 2, why: 'nombres[i + 1] se salta el primero y se sale de la lista al final.', code: `nombres = ["Ana", "Luis", "Rosa"]
for i in range(len(nombres)):
    print(nombres[i + 1])  @@` },
  { id: 'py-lower', lang: 'Python', level: 2, why: '"A" mayúscula no está en "aeiou". Hay que usar letra.lower().', code: `def es_vocal(letra):
    return letra in "aeiou"  @@

print(es_vocal("A"))  # esperado: True` },
  { id: 'java-start', lang: 'Java', level: 2, why: 'El bucle empieza en 1 y se salta nums[0]. Debe empezar en 0.', code: `int[] nums = {4, 8, 15, 16, 23, 42};
int suma = 0;
for (int i = 1; i < nums.length; i++) {  @@
  suma += nums[i];
}
System.out.println(suma); // esperado: 108` },
  { id: 'js-map', lang: 'JavaScript', level: 2, why: 'Con llaves {} la arrow function necesita "return". Sin llaves devolvería el valor.', code: `const precios = [10, 20, 30];
const conImpuesto = precios.map(p => { p * 1.18 });  @@
console.log(conImpuesto); // [undefined, undefined, undefined]` },
  { id: 'py-while', lang: 'Python', level: 2, why: 'contador - 1 no modifica nada: bucle infinito. Debe ser contador += 1.', code: `contador = 0
while contador < 5:
    print("Iteración", contador)
    contador - 1  @@` },
  { id: 'c-intdiv', lang: 'C', level: 2, why: 'a / b entre enteros da 3. Hay que convertir: (float) a / b.', code: `#include <stdio.h>
int main() {
  int a = 7, b = 2;
  float div = a / b;  @@
  printf("%.1f\\n", div); // esperado 3.5
  return 0;
}` },
  { id: 'py-items', lang: 'Python', level: 2, why: 'Recorrer un dict da solo las claves. Para clave y valor se usa usuarios.items().', code: `usuarios = {"ana": 20, "luis": 22}
usuarios["rosa"] = 19
for nombre, edad in usuarios:  @@
    print(nombre, edad)` },
  { id: 'js-listener', lang: 'JavaScript', level: 2, why: 'enviar() se ejecuta de inmediato. Hay que pasar la función: enviar (sin paréntesis).', code: `const btn = document.querySelector("#enviar");
btn.addEventListener("click", enviar());  @@
function enviar() {
  alert("¡Enviado!");
}` },
  { id: 'py-assign', lang: 'Python', level: 2, why: 'Para comparar se usa ==. Un solo = es asignación (error de sintaxis).', code: `import random
dado = random.randint(1, 6)
if dado = 6:  @@
    print("¡Seis! Repites turno")` },

  // ---------- Nivel 3: medio ----------
  { id: 'py-default', lang: 'Python', level: 3, why: 'La lista por defecto se crea una sola vez y se comparte entre llamadas. Usa lista=None.', code: `def agregar(item, lista=[]):  @@
    lista.append(item)
    return lista

print(agregar("a"))  # ['a']
print(agregar("b"))  # esperado ['b'] 🤔` },
  { id: 'js-await', lang: 'JavaScript', level: 3, why: 'Falta await en fetch: res es una Promise y no tiene .json() todavía.', code: `async function cargarUsuario(id) {
  const res = fetch(\`/api/usuarios/\${id}\`);  @@
  const data = await res.json();
  return data;
}` },
  { id: 'js-var', lang: 'JavaScript', level: 3, why: 'Con var, i es compartida por todos los callbacks. Con let cada vuelta tiene su propia i.', code: `for (var i = 0; i < 3; i++) {  @@
  setTimeout(() => console.log(i), 100);
}
// imprime 3, 3, 3 en vez de 0, 1, 2` },
  { id: 'java-streq', lang: 'Java', level: 3, why: 'En Java, == compara referencias. Para Strings se usa clave.equals("dsc2026").', code: `Scanner sc = new Scanner(System.in);
String clave = sc.nextLine();
if (clave == "dsc2026") {  @@
  System.out.println("Acceso concedido");
}` },
  { id: 'py-fact', lang: 'Python', level: 3, why: 'factorial(n) se llama a sí misma con el mismo n: recursión infinita. Debe ser factorial(n - 1).', code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n)  @@` },
  { id: 'js-sort', lang: 'JavaScript', level: 3, why: 'sort() ordena como texto ("100" < "25"). Hay que usar sort((a, b) => a - b).', code: `const puntajes = [100, 25, 9, 1000];
puntajes.sort();  @@
console.log(puntajes); // esperado [9, 25, 100, 1000]` },
  { id: 'py-bsearch', lang: 'Python', level: 3, why: 'Con lo < hi nunca revisa el caso de un solo elemento. Debe ser lo <= hi.', code: `def buscar(arr, x):
    lo, hi = 0, len(arr) - 1
    while lo < hi:  @@
        mid = (lo + hi) // 2
        if arr[mid] == x:
            return mid
        elif arr[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1` },
  { id: 'c-overflow', lang: 'C', level: 3, why: 'El arreglo tiene índices 0..2; con i <= 3 se lee fuera de memoria.', code: `#include <stdio.h>
int main() {
  int notas[3] = {14, 17, 19};
  for (int i = 0; i <= 3; i++) {  @@
    printf("%d\\n", notas[i]);
  }
  return 0;
}` },
]

export function parseSnippet(s: Snippet): ParsedSnippet {
  const raw = s.code.split('\n')
  const bug = raw.findIndex((l) => l.trimEnd().endsWith('@@')) + 1
  const lines = raw.map((l) => l.replace(/\s*@@\s*$/, ''))
  return { ...s, lines, bug }
}
