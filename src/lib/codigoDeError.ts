// Código estable de un error del API, sin importar de qué router venga:
//
// 1. Huma (ventas, cobranza, visitas, desempeño…): msp-api lo manda en
//    `errors[].message` como "code=<codigo>" (venthttp/auth.go, mapAppError);
//    no hay `code` de primer nivel.
// 2. chi + response.Problem (auth, usuarios): `code` de primer nivel.
// 3. Forma vieja "<codigo>: mensaje" en `errors[].message`, por compatibilidad.
//
// Devuelve null si el cuerpo no trae código; cada mapper decide su respaldo
// (timeout, network_error, http_<status>).
const CODIGO = /^[a-z0-9_]+$/;

function mensajes(cuerpo: Record<string, unknown>): string[] {
  if (!Array.isArray(cuerpo.errors)) return [];
  const out: string[] = [];
  for (const e of cuerpo.errors) {
    const m = e && typeof e === "object" ? (e as { message?: unknown }).message : null;
    if (typeof m === "string") out.push(m.trim());
  }
  return out;
}

export function codigoDeError(cuerpo: unknown): string | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const datos = cuerpo as Record<string, unknown>;
  const lista = mensajes(datos);

  for (const m of lista) {
    if (!m.startsWith("code=")) continue;
    const codigo = m.slice("code=".length).trim();
    if (CODIGO.test(codigo)) return codigo;
  }

  if (typeof datos.code === "string" && datos.code.trim() !== "") return datos.code.trim();

  for (const m of lista) {
    const i = m.indexOf(":");
    if (i > 0 && CODIGO.test(m.slice(0, i))) return m.slice(0, i);
  }
  return null;
}
