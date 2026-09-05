# Prueba de Escritorio (Web)

Herramienta de estudio para resolver ejercicios de **Python** con la técnica de *prueba de escritorio*: ejecuta el código paso a paso dentro del navegador y muestra tabla por tabla cómo cambian las variables en cada línea.

![Estado](https://img.shields.io/badge/estado-estable-green) ![Python en navegador](https://img.shields.io/badge/ejecuci%C3%B3n-Pyodide%20sin%20servidor-blue) ![Stack](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-orange)

Escribí, pegá o subí una captura del código y mirá cómo cambian las variables línea por línea.

---

## Cómo funciona

La app corre 100% en el navegador, sin servidor ni instalación:

- **OCR** de capturas con [Tesseract.js](https://tesseract.projectnaptha.com/) (español + inglés).
- **Ejecución de Python** con [Pyodide](https://pyodide.org/) (Python compilado a WebAssembly). El script se ejecuta con un `sys.settrace` que registra el estado de las variables antes de cada línea ejecutada.
- La tabla resultante se puede **copiar al portapapeles** para pegarla en un TP o Word.

## Cómo usarla

### Opción 1: En línea (GitHub Pages) — recomendada

Subí el proyecto a GitHub y activá **GitHub Pages**:

`Settings → Pages → Deploy from a branch → main → / (root)`.

La app vive en `index.html`, así que no hace falta nada más. También podés hostearla en cualquier hosting estático (Vercel, Netlify, etc.).

### Opción 2: Local

1. Descargá o cloná el repositorio.
2. Abrí **`index.html`** con Chrome o Edge.
   > Alternativa con servidor local (recomendada si tenés alguna restricción con `file://`):
   > ```bash
   > npx serve
   > ```
   > y entrá a la URL que te muestra.
3. ¡Listo! No requiere build ni `npm install`.

> ⚠️ **Necesita conexión a Internet la primera vez**, porque carga Tesseract.js y Pyodide (~20 MB) desde un CDN. Después quedan cacheados para esa sesión.

## Uso paso a paso

1. **Escribí el código** del ejercicio en el área de texto *"Código del ejercicio"* (o usá **Cargar ejemplo**).
2. Si el código usa `print(...)`, se captura automáticamente la salida.
3. Si el código usa `input(...)`, escribí **un valor por línea** en *"Valores para input()"*.
4. Tocá **Generar prueba de escritorio**.
5. Revisá la tabla: cada fila muestra el estado de las variables **antes** de ejecutar esa línea.
6. Usá **Copiar tabla** para exportarla al portapapeles.

### Variante con captura (OCR)

1. En la sección *"O subí una captura del ejercicio"*, elegí un archivo **PNG, JPG o JPEG** (o pegá una imagen con `Ctrl+V`).
2. Tocá **Extraer código de la captura**.
3. **Revisá el código extraído** en el textarea (el OCR no es perfecto) y seguí con el paso 3.

## Controles

| Control                       | Qué hace                                                                 |
|-------------------------------|---------------------------------------------------------------------------|
| **Pegar código**              | Pega el contenido del portapapeles en el editor.                          |
| **Cargar ejemplo**            | Carga un ejemplo de operaciones aritméticas.                              |
| **Extraer código de la captura** | Lee la imagen cargada con OCR y completa el código.                     |
| **Quitar imagen**             | Descarta la captura cargada.                                              |
| **Generar prueba de escritorio** | Ejecuta el ejercicio y arma la tabla paso a paso.                        |
| **Copiar tabla**              | Copia la tabla como texto separado por tabs (ideal para pegar en un TP).  |
| **Limpiar todo**              | Borra el código, las entradas, la imagen y el resultado.                  |

## Limitaciones y notas

- Pensado para **ejercicios básicos de Python** (variables, operadores, `if`, `while`, `for`, funciones sencillas).
- El **OCR puede confundir** símbolos, comillas o sangrías: siempre revisá el texto extraído antes de ejecutar.
- La tabla muestra las variables **antes** de ejecutar cada línea.
- Hay un **límite de 500 pasos** para evitar bucles infinitos (si se supera, se muestra un error). Podés aumentar `MAX_PASOS` en `app.js`.
- `input()` devuelve los valores que escribiste en *"Valores para input()"*; si faltan, devuelve cadena vacía.
- Los errores de Python se muestran completos (tipo + mensaje) en el estado de ejecución.

## Estructura del proyecto

```
├── index.html   # Interfaz (pasos 01 a 04)
├── styles.css   # Estilos y diseño
└── app.js       # OCR, ejecución con Pyodide y renderizado de la tabla
```

## Stack

- HTML + CSS + JavaScript (sin framework, sin build)
- [Tesseract.js](https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js) — OCR en el navegador
- [Pyodide](https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js) — Python en WebAssembly