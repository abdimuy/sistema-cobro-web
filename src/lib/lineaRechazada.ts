// Línea que una regla de precios de msp-api rechazó (E-VEN-008). El 422 de
// ventas (internal/ventas/infra/venthttp/auth.go, mapAppError) trae, después
// del detalle `code=…`, uno por campo:
//   { message: "articulo=<nombre>", location: "linea.articulo", value: <nombre> }
//   { message: "combo=<nombre>",    location: "linea.combo",    value: <nombre> }
const ETIQUETAS: Record<string, string> = {
  "linea.articulo": "Artículo",
  "linea.combo": "Combo",
};

function nombreDe(entrada: Record<string, unknown>, campo: string): string | null {
  if (typeof entrada.value === "string" && entrada.value.trim() !== "") return entrada.value.trim();
  if (typeof entrada.value === "number") return String(entrada.value);
  const prefijo = `${campo}=`;
  if (typeof entrada.message === "string" && entrada.message.startsWith(prefijo)) {
    const n = entrada.message.slice(prefijo.length).trim();
    return n !== "" ? n : null;
  }
  return null;
}

/** "Artículo: X" / "Combo: Y" (ambos con " · " si vienen los dos), o null. */
export function lineaRechazada(cuerpo: unknown): string | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const errores = (cuerpo as { errors?: unknown }).errors;
  if (!Array.isArray(errores)) return null;
  const partes: string[] = [];
  for (const e of errores) {
    if (!e || typeof e !== "object") continue;
    const entrada = e as Record<string, unknown>;
    const location = typeof entrada.location === "string" ? entrada.location : "";
    const etiqueta = ETIQUETAS[location];
    if (!etiqueta) continue;
    const nombre = nombreDe(entrada, location.slice("linea.".length));
    if (nombre !== null) partes.push(`${etiqueta}: ${nombre}`);
  }
  return partes.length > 0 ? partes.join(" · ") : null;
}

/** El mensaje con la línea al lado cuando el cuerpo la trae; igual si no. */
export function conLineaRechazada(mensaje: string, cuerpo: unknown): string {
  const linea = lineaRechazada(cuerpo);
  return linea === null ? mensaje : `${mensaje} · ${linea}`;
}

/** Igual, para un cuerpo que llega como texto (p. ej. replay_body_preview). */
export function conLineaRechazadaDeTexto(mensaje: string, texto: string): string {
  try {
    return conLineaRechazada(mensaje, JSON.parse(texto));
  } catch {
    return mensaje;
  }
}
