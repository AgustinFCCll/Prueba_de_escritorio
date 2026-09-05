const inputImagen = document.getElementById("imagen");
const previewBox = document.getElementById("previewBox");
const preview = document.getElementById("preview");
const btnOcr = document.getElementById("btnOcr");
const btnQuitar = document.getElementById("btnQuitar");
const btnResolver = document.getElementById("btnResolver");
const btnEjemplo = document.getElementById("btnEjemplo");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnCopiar = document.getElementById("btnCopiar");
const btnPegar = document.getElementById("btnPegar");
const codigo = document.getElementById("codigo");
const entradas = document.getElementById("entradas");
const estadoOcr = document.getElementById("estadoOcr");
const estadoPython = document.getElementById("estadoPython");
const estadoPegar = document.getElementById("estadoPegar");
const resultado = document.getElementById("resultado");
const tablaBody = document.getElementById("tablaBody");
const salidaFinal = document.getElementById("salidaFinal");

let archivoImagen = null;
let blobUrlActual = null;
let pyodide = null;
let ultimaTabla = [];

// ——— Pegar código del portapapeles ———
btnPegar.addEventListener("click", async () => {
  try {
    const texto = await navigator.clipboard.readText();
    if (texto.trim()) {
      codigo.value = texto;
      estadoPegar.classList.remove("error");
      estadoPegar.textContent = "Código pegado del portapapeles.";
      setTimeout(() => { estadoPegar.textContent = ""; }, 2000);
    } else {
      estadoPegar.textContent = "El portapapeles está vacío.";
    }
  } catch {
    estadoPegar.classList.add("error");
    estadoPegar.textContent =
      "No se pudo acceder al portapapeles. Pegá manualmente con Ctrl+V.";
  }
});

// ——— Cargar ejemplo ———
btnEjemplo.addEventListener("click", () => {
  codigo.value = `a = 5
b = 3

suma = a + b
resta = a - b
multiplicacion = a * b
division = a / b

print("Suma:", suma)
print("Resta:", resta)
print("Multiplicación:", multiplicacion)
print("División:", division)`;
  entradas.value = "";
  estadoPegar.classList.remove("error");
  estadoPegar.textContent = "Ejemplo cargado.";
  setTimeout(() => { estadoPegar.textContent = ""; }, 2000);
});

// ——— Imagen: selección ———
inputImagen.addEventListener("change", () => {
  const archivo = inputImagen.files[0];
  if (!archivo) return;

  revocarBlobAnterior();
  archivoImagen = archivo;
  blobUrlActual = URL.createObjectURL(archivo);
  preview.src = blobUrlActual;
  previewBox.classList.remove("oculto");
  btnOcr.disabled = false;
  btnQuitar.disabled = false;
  estadoOcr.textContent = "";
});

// ——— Imagen: quitar ———
btnQuitar.addEventListener("click", () => {
  revocarBlobAnterior();
  archivoImagen = null;
  inputImagen.value = "";
  preview.removeAttribute("src");
  previewBox.classList.add("oculto");
  btnOcr.disabled = true;
  btnQuitar.disabled = true;
  estadoOcr.textContent = "";
});

function revocarBlobAnterior() {
  if (blobUrlActual) {
    URL.revokeObjectURL(blobUrlActual);
    blobUrlActual = null;
  }
}

// ——— Pegar imagen desde clipboard (Ctrl+V) ———
document.addEventListener("paste", (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      e.preventDefault();
      const archivo = item.getAsFile();
      if (archivo) {
        revocarBlobAnterior();
        archivoImagen = archivo;
        blobUrlActual = URL.createObjectURL(archivo);
        preview.src = blobUrlActual;
        previewBox.classList.remove("oculto");
        btnOcr.disabled = false;
        btnQuitar.disabled = false;
        estadoOcr.textContent = "Imagen pegada desde el portapapeles.";
      }
      return;
    }
  }
});

// ——— OCR ———
btnOcr.addEventListener("click", async () => {
  if (!archivoImagen) return;

  try {
    btnOcr.disabled = true;
    btnQuitar.disabled = true;
    estadoOcr.classList.remove("error");
    estadoOcr.textContent = "Leyendo la captura...";

    const resultadoOCR = await Tesseract.recognize(archivoImagen, "spa+eng", {
      logger: (info) => {
        if (info.status === "recognizing text") {
          estadoOcr.textContent =
            `Leyendo la captura... ${Math.round(info.progress * 100)}%`;
        }
      }
    });

    const texto = limpiarTextoOCR(resultadoOCR.data.text);
    codigo.value = texto;
    estadoOcr.classList.remove("error");
    estadoOcr.textContent =
      "Texto extraído. Revisalo: el OCR puede confundir símbolos o sangrías.";
  } catch (error) {
    console.error("Error OCR:", error);
    estadoOcr.classList.add("error");
    estadoOcr.textContent =
      `No se pudo leer la imagen (${error.message}). Podés escribir o pegar el código arriba.`;
  } finally {
    btnOcr.disabled = false;
    btnQuitar.disabled = false;
  }
});

// ——— Limpiar todo ———
btnLimpiar.addEventListener("click", () => {
  codigo.value = "";
  entradas.value = "";
  tablaBody.innerHTML = "";
  salidaFinal.textContent = "(sin salida)";
  resultado.classList.add("oculto");
  estadoPython.textContent = "";
  estadoPegar.textContent = "";
  estadoOcr.textContent = "";
  revocarBlobAnterior();
  archivoImagen = null;
  inputImagen.value = "";
  preview.removeAttribute("src");
  previewBox.classList.add("oculto");
  btnOcr.disabled = true;
  btnQuitar.disabled = true;
  ultimaTabla = [];
});

// ——— Ejecutar ———
btnResolver.addEventListener("click", async () => {
  const codigoUsuario = codigo.value.trim();

  if (!codigoUsuario) {
    estadoPython.classList.add("error");
    estadoPython.textContent =
      "Escribí, pegá o subí una captura del código antes de ejecutar.";
    return;
  }

  try {
    estadoPython.classList.remove("error");
    btnResolver.disabled = true;

    if (!pyodide) {
      estadoPython.textContent = "Descargando Python en el navegador (primera vez, ~20 MB)...";
      try {
        pyodide = await loadPyodide();
      } catch (e) {
        throw new Error(
          "No se pudo descargar Pyodide. Verificá tu conexión a internet y recargá la página."
        );
      }
    }

    estadoPython.textContent = "Ejecutando el ejercicio y armando la prueba de escritorio...";

    const valoresEntrada = entradas.value
      .split("\n")
      .map(v => v.trim())
      .filter(v => v.length > 0);

    pyodide.globals.set("codigo_usuario", codigoUsuario);
    pyodide.globals.set("entradas_usuario_js", valoresEntrada);

    const script = `
import sys
import json
import builtins

codigo = codigo_usuario
lineas = codigo.splitlines()

entradas_usuario = list(entradas_usuario_js.to_py())
indice_entrada = 0
salida = []
pasos = []
contador = 0
MAX_PASOS = 500

VARIABLES_INTERNAS = {
    "builtins", "sys", "json", "builtins",
    "codigo", "lineas", "entradas_usuario",
    "indice_entrada", "salida", "pasos",
    "contador", "MAX_PASOS", "VARIABLES_INTERNAS",
    "representacion_segura", "input_controlado",
    "print_controlado", "tracer", "namespace",
    "error", "resultado", "exc", "nombre_func",
}

def representacion_segura(valor):
    try:
        texto = repr(valor)
        if len(texto) > 140:
            texto = texto[:137] + "..."
        return texto
    except Exception:
        return "<valor no representable>"

def input_controlado(prompt=""):
    global indice_entrada
    if prompt:
        salida.append(str(prompt))

    if indice_entrada >= len(entradas_usuario):
        valor = ""
    else:
        valor = entradas_usuario[indice_entrada]
        indice_entrada += 1
    return valor

def print_controlado(*args, sep=" ", end="\\n", **kwargs):
    salida.append(sep.join(str(x) for x in args) + end)

nombre_func = None

def tracer(frame, event, arg):
    global contador, nombre_func

    if frame.f_code.co_filename != "<ejercicio>":
        return tracer

    if event == "call":
        return tracer

    if event == "line":
        contador += 1

        if contador > MAX_PASOS:
            raise RuntimeError(
                "Se superaron 500 pasos. Puede haber un bucle infinito."
            )

        numero = frame.f_lineno
        if numero < 1 or numero > len(lineas):
            return tracer

        instruccion = lineas[numero - 1]

        if frame.f_code.co_name != "<module>":
            nombre_func = frame.f_code.co_name
        elif nombre_func is not None:
            nombre_func = None

        variables = {}
        for nombre_var, valor in frame.f_locals.items():
            if nombre_var.startswith("__"):
                continue
            if nombre_var in VARIABLES_INTERNAS:
                continue
            if nombre_var in {"input", "print"}:
                continue
            if nombre_var == nombre_func:
                continue
            variables[nombre_var] = representacion_segura(valor)

        pasos.append({
            "paso": contador,
            "linea": numero,
            "instruccion": instruccion,
            "variables": variables,
            "salida": "".join(salida)
        })

    return tracer

namespace = {
    "__name__": "__main__",
    "__builtins__": dict(vars(builtins))
}

namespace["__builtins__"]["input"] = input_controlado
namespace["__builtins__"]["print"] = print_controlado

error = None

try:
    sys.settrace(tracer)
    exec(compile(codigo, "<ejercicio>", "exec"), namespace, namespace)
except Exception as exc:
    error = f"{type(exc).__name__}: {exc}"
finally:
    sys.settrace(None)

resultado = {
    "pasos": pasos,
    "salida_final": "".join(salida),
    "error": error
}

json.dumps(resultado, ensure_ascii=False)
`;

    const respuesta = await pyodide.runPythonAsync(script);
    const datos = JSON.parse(respuesta);

    renderizarTabla(datos.pasos);
    salidaFinal.textContent = datos.salida_final || "(sin salida)";
    resultado.classList.remove("oculto");

    if (datos.error) {
      estadoPython.classList.add("error");
      estadoPython.textContent =
        `El programa se detuvo: ${datos.error}`;
    } else {
      estadoPython.textContent =
        `Listo. Se registraron ${datos.pasos.length} pasos.`;
    }
  } catch (error) {
    console.error("Error ejecutando:", error);
    estadoPython.classList.add("error");
    estadoPython.textContent =
      `No se pudo ejecutar: ${error.message}`;
  } finally {
    btnResolver.disabled = false;
  }
});

// ——— Copiar tabla ———
btnCopiar.addEventListener("click", async () => {
  if (!ultimaTabla.length) return;

  const lineas = [
    "Paso\tLínea\tInstrucción\tVariables\tSalida acumulada",
    ...ultimaTabla.map(fila => {
      const variables = Object.entries(fila.variables)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");

      return [
        fila.paso,
        fila.linea,
        fila.instruccion.replace(/\t/g, " "),
        variables,
        fila.salida.replace(/\n/g, "\\n")
      ].join("\t");
    })
  ];

  try {
    await navigator.clipboard.writeText(lineas.join("\n"));
    btnCopiar.textContent = "Copiado";
    setTimeout(() => { btnCopiar.textContent = "Copiar tabla"; }, 1200);
  } catch {
    btnCopiar.textContent = "Error al copiar";
    setTimeout(() => { btnCopiar.textContent = "Copiar tabla"; }, 1200);
  }
});

// ——— Utilidades ———
function limpiarTextoOCR(texto) {
  return texto
    .replace(/\r/g, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\u00A0/g, " ")
    .trim();
}

function renderizarTabla(pasos) {
  ultimaTabla = pasos;
  tablaBody.innerHTML = "";

  pasos.forEach(fila => {
    const tr = document.createElement("tr");

    const variables = Object.keys(fila.variables).length
      ? Object.entries(fila.variables)
          .map(([nombre, valor]) => `${nombre} = ${valor}`)
          .join("\n")
      : "\u2014";

    const tdPaso = document.createElement("td");
    tdPaso.textContent = fila.paso;

    const tdLinea = document.createElement("td");
    tdLinea.textContent = fila.linea;

    const tdInstruccion = document.createElement("td");
    const code = document.createElement("code");
    code.textContent = fila.instruccion;
    tdInstruccion.appendChild(code);

    const tdVariables = document.createElement("td");
    tdVariables.className = "variables";
    tdVariables.textContent = variables;

    const tdSalida = document.createElement("td");
    const pre = document.createElement("pre");
    pre.className = "salida-mini";
    pre.textContent = fila.salida || "\u2014";
    tdSalida.appendChild(pre);

    tr.appendChild(tdPaso);
    tr.appendChild(tdLinea);
    tr.appendChild(tdInstruccion);
    tr.appendChild(tdVariables);
    tr.appendChild(tdSalida);

    tablaBody.appendChild(tr);
  });
}
