Quiero transformar el notebook .ipynb existente en este proyecto, que contiene una calculadora de métodos numéricos, en una aplicación web full-stack profesional.

Quiero que actúes como un Senior Full-Stack Engineer con experiencia en Python, FastAPI, Next.js, TypeScript, métodos numéricos y visualización científica.

OBJETIVO PRINCIPAL

Convertir la calculadora actual basada en consola/Jupyter en una aplicación web donde el usuario pueda:

* Seleccionar uno de los métodos numéricos.
* Introducir una función matemática.
* Introducir los parámetros requeridos por el método.
* Ejecutar el algoritmo.
* Ver el resultado final.
* Ver el estado de convergencia.
* Ver el número de iteraciones.
* Ver una tabla completa de iteraciones.
* Ver una gráfica interactiva de la función.
* Ver una gráfica interactiva del error.
* Explorar visualmente las aproximaciones realizadas por el algoritmo.

La aplicación debe sentirse como una herramienta académica/profesional de métodos numéricos, no como una simple conversión del notebook a una página web.

⸻

1. PRIMERA FASE: ANALIZAR EL PROYECTO

Antes de modificar código:

1. Inspecciona todos los archivos existentes.
2. Localiza el notebook .ipynb.
3. Lee y analiza completamente el notebook.
4. Identifica los 7 algoritmos implementados.
5. Identifica funciones auxiliares como parse_function() y plot_results().
6. Identifica qué código corresponde a:
    * lógica matemática
    * entrada por consola
    * salida por consola
    * generación de gráficas
    * construcción de tablas
7. Detecta posibles errores matemáticos o problemas de robustez.
8. No elimines el notebook original.
9. Antes de realizar cambios importantes, presenta un breve resumen de la arquitectura que vas a implementar.

No quiero una conversión automática línea por línea.

Quiero una refactorización real.

⸻

2. MÉTODOS QUE DEBEN CONSERVARSE

La aplicación debe implementar estos siete métodos:

1. Bisección
2. Falsa Posición
3. Razón Dorada
4. Interpolación Cuadrática
5. Newton — Optimización
6. Newton-Raphson — Búsqueda de raíces
7. Búsqueda Aleatoria

La lógica matemática debe conservarse siempre que sea correcta.

Si corriges un error matemático, documenta qué cambiaste y por qué.

⸻

3. ARQUITECTURA

Utiliza una arquitectura separando claramente frontend y backend.

Propuesta:

numerical-methods/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── algorithms/
│   │       ├── bisection.py
│   │       ├── false_position.py
│   │       ├── golden_section.py
│   │       ├── quadratic_interpolation.py
│   │       ├── newton_optimization.py
│   │       ├── newton_raphson.py
│   │       └── random_search.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── notebook/
│   └── [notebook original]
│
├── README.md
└── docker-compose.yml

Puedes modificar esta estructura si encuentras una alternativa mejor, pero mantén una separación clara de responsabilidades.

⸻

4. BACKEND

Utiliza:

* Python
* FastAPI
* Pydantic
* NumPy
* SymPy

El backend será responsable de:

* Validar los parámetros.
* Parsear las funciones matemáticas.
* Ejecutar los algoritmos.
* Generar los resultados.
* Devolver las iteraciones.
* Devolver los errores.
* Devolver las aproximaciones.
* Proporcionar datos suficientes para que el frontend pueda generar las gráficas.

No generes gráficas con Matplotlib en el backend.

La visualización debe hacerse en el frontend.

⸻

5. REFACTORIZACIÓN DE LOS ALGORITMOS

Actualmente los métodos utilizan:

input()
print()
plt.show()

Elimina completamente esta interacción de los algoritmos.

Por ejemplo, NO quiero:

def biseccion():
    expr = input(...)

Quiero algo equivalente a:

def biseccion(
    function,
    a,
    b,
    tolerance,
    max_iterations
):
    ...
    return result

Los algoritmos deben ser funciones puras en la medida de lo posible.

⸻

6. MODELO DE RESULTADOS

Crea un modelo estructurado para los resultados.

Por ejemplo:

class NumericalResult:
    converged: bool
    message: str
    final_x: float | None
    final_fx: float | None
    iterations: int
    errors: list[float]
    x_history: list[float]
    table: list[dict]

Puedes utilizar Pydantic/dataclasses según corresponda.

La respuesta JSON debe ser consistente entre métodos.

Los campos específicos de cada método pueden incluirse dentro de table.

Ejemplo:

{
  "converged": true,
  "message": "Convergencia alcanzada",
  "final_x": 1.5213797,
  "final_fx": 0.0000001,
  "iterations": 21,
  "errors": [...],
  "x_history": [...],
  "table": [...]
}

⸻

7. PARSER MATEMÁTICO

Actualmente se utiliza:

sp.sympify(expr_str)

Revisa esta implementación.

Quiero permitir expresiones como:

x**3 - x - 2
x**2 + 4*x + 1
sin(x)
cos(x)
exp(x)
log(x)
sqrt(x)

No permitas ejecución arbitraria de código Python.

Utiliza una estrategia razonablemente segura de parsing con SymPy.

El backend debe devolver errores comprensibles si la función no es válida.

⸻

8. API REST

Diseña una API limpia.

Puedes utilizar un endpoint general:

POST /api/v1/methods/{method}

o endpoints separados si consideras que es más limpio.

Por ejemplo:

POST /api/v1/methods/bisection
POST /api/v1/methods/false-position
POST /api/v1/methods/golden-section
POST /api/v1/methods/quadratic-interpolation
POST /api/v1/methods/newton-optimization
POST /api/v1/methods/newton-raphson
POST /api/v1/methods/random-search

Utiliza modelos Pydantic para los requests.

Cada método debe validar únicamente los parámetros que necesita.

⸻

9. VALIDACIONES MATEMÁTICAS

Implementa validaciones robustas.

General

* función vacía
* función inválida
* parámetros no numéricos
* tolerancia <= 0
* iteraciones <= 0
* NaN
* Infinity
* errores de evaluación

Bisección

Validar:

f(a) * f(b) < 0

También manejar el caso:

f(a) == 0
f(b) == 0

Falsa Posición

Evitar divisiones por cero.

Razón Dorada

Validar:

a < b

Mantenerla inicialmente como problema de minimización.

Interpolación Cuadrática

Manejar denominador cero o prácticamente cero.

Newton Optimización

Calcular automáticamente:

f'(x)
f''(x)

mediante SymPy.

Manejar:

f''(x) = 0

Newton-Raphson

Calcular:

f'(x)

automáticamente.

Manejar:

f'(x) = 0

Búsqueda Aleatoria

Validar correctamente el rango:

a < b

⸻

10. FRONTEND

Utiliza:

* Next.js
* TypeScript
* Tailwind CSS
* componentes modernos
* una librería de componentes como shadcn/ui si resulta apropiada
* Plotly o una librería equivalente para las gráficas

Quiero una interfaz moderna y limpia.

No quiero una interfaz que parezca un formulario HTML antiguo.

⸻

11. DISEÑO DE LA INTERFAZ

La aplicación debe tener una estructura similar a:

┌────────────────────────────────────────────────────────────┐
│  NUMERICAL LAB                               Theme ◐       │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ METHODS       │  Bisection                                 │
│               │                                            │
│ ● Bisection   │  Find a root of f(x)                       │
│ ○ False Pos.  │                                            │
│ ○ Golden      │  Function                                  │
│   Section     │  ┌──────────────────────────────────────┐  │
│ ○ Quadratic   │  │ x**3 - x - 2                         │  │
│   Interp.     │  └──────────────────────────────────────┘  │
│ ○ Newton      │                                            │
│   Optimization│  a                    b                   │
│ ○ Newton-     │  ┌────────────┐       ┌────────────┐      │
│   Raphson     │  │ 1          │       │ 2          │      │
│ ○ Random      │  └────────────┘       └────────────┘      │
│   Search      │                                            │
│               │  Tolerance            Max iterations       │
│               │  ┌────────────┐       ┌────────────┐      │
│               │  │ 1e-6       │       │ 100        │      │
│               │  └────────────┘       └────────────┘      │
│               │                                            │
│               │             [ Run Method ]                 │
│               │                                            │
├───────────────┴────────────────────────────────────────────┤
│ RESULT                                                     │
│                                                            │
│ x ≈ 1.5213797     f(x) ≈ 0       21 iterations             │
│                                                            │
├────────────────────────────┬───────────────────────────────┤
│ FUNCTION                   │ ERROR                         │
│                            │                               │
│       ╱                    │ ╲                             │
│     ╱                      │  ╲                            │
│ ───●────────────           │   ╲___                        │
│                            │                               │
├────────────────────────────┴───────────────────────────────┤
│ ITERATIONS                                                 │
│                                                            │
│ Iter | a | b | xr | f(xr) | Error                          │
│                                                            │
└────────────────────────────────────────────────────────────┘

No es necesario copiar exactamente este diseño.

Prioriza:

* claridad
* jerarquía visual
* facilidad de uso
* responsive design
* buena visualización matemática

⸻

12. SELECTOR DE MÉTODO

El usuario debe poder cambiar entre:

Bisección
Falsa Posición
Razón Dorada
Interpolación Cuadrática
Newton — Optimización
Newton-Raphson
Búsqueda Aleatoria

Cuando cambia el método:

* actualizar descripción
* actualizar formulario
* mostrar únicamente parámetros necesarios
* limpiar resultados anteriores

No quiero siete páginas independientes.

⸻

13. FORMULARIOS DINÁMICOS

Bisección

Función
a
b
Tolerancia
Máximo de iteraciones

Falsa Posición

Función
a
b
Tolerancia
Máximo de iteraciones

Razón Dorada

Función
xl
xu
Tolerancia
Máximo de iteraciones

Interpolación Cuadrática

Función
x0
x1
x2
Tolerancia
Máximo de iteraciones

Newton Optimización

Función
x0
Tolerancia
Máximo de iteraciones

Newton-Raphson

Función
x0
Tolerancia
Máximo de iteraciones

Búsqueda Aleatoria

Función
Límite inferior
Límite superior
Máximo de iteraciones

⸻

14. RESULTADOS

Después de ejecutar un método quiero mostrar un panel destacado:

CONVERGED
Resultado
x = 1.5213797068
f(x)
≈ 0
Iteraciones
21

Si no converge:

MAXIMUM ITERATIONS REACHED
El método alcanzó el número máximo
de iteraciones sin cumplir la tolerancia.

Si ocurre un error matemático:

METHOD ERROR
La derivada se hace cero en x = ...

Los mensajes deben ser claros para estudiantes.

⸻

15. TABLA DE ITERACIONES

Crear un componente reutilizable:

IterationTable

Debe:

* generar columnas dinámicamente
* soportar diferentes estructuras de datos
* scroll horizontal
* scroll vertical
* mostrar números con formato legible
* indicar claramente la iteración

Ejemplo Bisección:

Iter | a | b | xr | f(xr) | Error

Newton:

Iter | xi | f'(xi) | f''(xi) | xi+1 | Error

Newton-Raphson:

Iter | xi | f(xi) | f'(xi) | xi+1 | Error

⸻

16. GRÁFICA DE LA FUNCIÓN

La gráfica debe generarse en el frontend.

Utiliza Plotly o una alternativa adecuada.

Debe mostrar:

* f(x)
* eje X
* eje Y
* y = 0
* puntos de aproximación
* línea que conecte las aproximaciones
* tooltip con coordenadas
* zoom
* pan
* leyenda

Ejemplo conceptual:

              f(x)
               │
           ╱   │
         ╱     │
───────●───────┼──────── x
      ●        │
    ●          │

⸻

17. GRÁFICA DEL ERROR

Crear una gráfica independiente:

Error vs Iteración

Debe mostrar:

* iteración
* error absoluto
* puntos
* tooltip
* zoom
* escala apropiada

Si el error disminuye rápidamente, la gráfica debe permitir visualizar la convergencia.

⸻

18. ESTADO DE LA APLICACIÓN

Muestra estados como:

Ready
Running...
Converged
Maximum iterations reached
Error

Mientras el backend procesa:

* deshabilitar botón Run
* mostrar indicador de carga
* evitar múltiples requests simultáneos

⸻

19. API CLIENT

Crea un cliente TypeScript centralizado.

Por ejemplo:

frontend/lib/api.ts

No quiero fetch() duplicado por todos los componentes.

Utiliza funciones como:

runBisection(...)
runFalsePosition(...)
runGoldenSection(...)

o una abstracción equivalente.

⸻

20. TIPOS TYPESCRIPT

Define correctamente los tipos de:

* requests
* responses
* iteration rows
* errors
* method metadata

Evita:

any

salvo que sea realmente necesario.

⸻

21. TESTING

Agrega tests para el backend.

Utiliza:

pytest

Como mínimo prueba:

Bisección

f(x) = x**3 - x - 2
a = 1
b = 2

La raíz esperada está aproximadamente en:

1.5213797

Newton-Raphson

f(x) = x**3 - x - 2
x0 = 1.5

Newton Optimization

f(x) = x**2 + 4*x + 4
x0 = 5

El mínimo esperado está cerca de:

x = -2

Golden Section

f(x) = (x - 3)**2 + 2
xl = 0
xu = 10

El mínimo esperado está cerca de:

x = 3

Prueba también casos inválidos.

⸻

22. CORS

Configura correctamente CORS en FastAPI para permitir el frontend durante desarrollo.

Por ejemplo:

Frontend:
http://localhost:3000
Backend:
http://localhost:8000

No utilices:

allow_origins=["*"]

si no es necesario.

Hazlo configurable mediante variables de entorno.

⸻

23. VARIABLES DE ENTORNO

Frontend:

NEXT_PUBLIC_API_URL

Backend:

CORS_ORIGINS

No hardcodees URLs.

Crea archivos de ejemplo:

.env.example

pero no incluyas secretos.

⸻

24. DOCKER

Si es razonablemente sencillo, crea:

docker-compose.yml

para ejecutar:

frontend
backend

con un solo comando:

docker compose up

No conviertas Docker en una fuente innecesaria de complejidad.

Primero asegúrate de que funcione localmente sin Docker.

⸻

25. README

Crea un README profesional.

Debe incluir:

* descripción
* screenshots si es posible
* características
* métodos implementados
* arquitectura
* tecnologías
* instalación
* ejecución del backend
* ejecución del frontend
* variables de entorno
* API
* testing
* Docker
* ejemplos de uso

Incluye ejemplos de funciones:

x**3 - x - 2
(x - 3)**2 + 2
x**2 + 4*x + 4
sin(x)

⸻

26. CALIDAD DE CÓDIGO

Quiero:

* TypeScript estricto
* Python con type hints
* PEP 8
* componentes reutilizables
* funciones pequeñas
* separación de responsabilidades
* nombres descriptivos
* manejo correcto de errores
* código fácil de mantener
* evitar duplicación

NO quiero:

* archivos gigantes
* componentes de 1000 líneas
* código duplicado
* any por todas partes
* lógica matemática dentro de componentes React
* llamadas HTTP directamente desde múltiples componentes
* comentarios excesivos
* sobreingeniería

⸻

27. IMPORTANTE: NO CAMBIES EL OBJETIVO MATEMÁTICO

Estos métodos tienen objetivos diferentes:

Bisección → búsqueda de raíces.

Falsa Posición → búsqueda de raíces.

Newton-Raphson → búsqueda de raíces.

Razón Dorada → optimización/minimización.

Interpolación Cuadrática → optimización.

Newton Optimization → optimización.

Random Search → minimización.

Mantén esa distinción en la UI y en las descripciones.

⸻

28. MEJORAS MATEMÁTICAS

Revisa especialmente el cálculo del error.

El criterio debe ser consistente y matemáticamente razonable.

Cuando corresponda, utiliza:

|x_next - x_current|

o el error asociado al método.

No cambies arbitrariamente el criterio sin analizar primero el algoritmo.

También considera tolerancias numéricas para comparaciones con cero cuando sea necesario.

⸻

29. EXPERIENCIA ACADÉMICA

La aplicación está pensada para estudiantes de métodos numéricos.

Por eso quiero que cada método tenga una pequeña descripción:

Ejemplo:

Bisección
Método iterativo para encontrar raíces de una función
cuando existe un cambio de signo dentro del intervalo.

También puedes mostrar:

Complexity
Convergence
Requirements

si puedes hacerlo de manera correcta.

No inventes información matemática.

⸻

30. ORDEN DE IMPLEMENTACIÓN

Trabaja en este orden:

FASE 1

Analizar notebook y proyecto.

FASE 2

Crear/refactorizar backend y algoritmos.

Primero:

* Bisección
* Falsa Posición
* Newton-Raphson

Verificar que funcionan.

FASE 3

Migrar:

* Razón Dorada
* Interpolación Cuadrática
* Newton Optimización
* Búsqueda Aleatoria

FASE 4

Crear API FastAPI.

FASE 5

Crear frontend Next.js.

FASE 6

Crear formularios dinámicos.

FASE 7

Crear resultados y tablas.

FASE 8

Crear gráficas interactivas.

FASE 9

Testing.

FASE 10

Docker + README.

⸻

31. REGLA IMPORTANTE PARA EL AGENT

No intentes implementar todo ciegamente en un solo paso.

Trabaja incrementalmente.

Después de cada fase:

1. Ejecuta pruebas.
2. Comprueba errores.
3. Corrige los problemas.
4. Continúa con la siguiente fase.

Si una decisión arquitectónica importante no está clara, analiza primero el código existente y toma la decisión más simple y mantenible.

No reemplaces tecnologías ni agregues dependencias sin una razón clara.

⸻

32. CRITERIO FINAL DE ÉXITO

Al terminar debe ser posible ejecutar:

Backend:

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend:

cd frontend
npm install
npm run dev

Y abrir:

http://localhost:3000

Desde ahí el usuario debe poder:

1. Seleccionar un método.
2. Introducir una función.
3. Introducir sus parámetros.
4. Ejecutarlo.
5. Recibir el resultado.
6. Ver el estado de convergencia.
7. Ver las iteraciones.
8. Ver la gráfica de la función.
9. Ver la gráfica del error.

Todos los siete métodos deben funcionar.

El notebook original debe permanecer intacto.

Antes de finalizar, ejecuta las pruebas y verifica que la aplicación completa funcione.

Al terminar, dame un resumen de:

* archivos creados/modificados
* arquitectura final
* métodos implementados
* pruebas realizadas
* errores encontrados y corregidos
* comandos para ejecutar el proyecto
* posibles mejoras futuras

Empieza ahora por inspeccionar el proyecto y el notebook. NO modifiques archivos todavía hasta terminar ese análisis inicial.