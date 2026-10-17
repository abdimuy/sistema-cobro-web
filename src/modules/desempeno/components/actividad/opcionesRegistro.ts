import { REGISTRADO_POR_OFICINA, type Actividad } from "../../domain/entities";

export type OpcionRegistro = { valor: string; etiqueta: string };

// Valor del filtro `registrado_por` (contrato v2 §4): el uid de quien registró
// o `oficina`. Un movimiento de la app sin uid resuelto no se puede filtrar.
export function valorRegistro(a: Actividad): string | null {
  const r = a.registradoPor;
  if (r.origen === "oficina") return REGISTRADO_POR_OFICINA;
  return r.usuarioUid;
}

// Nombres vistos por valor, para rotular una selección que ya no está en los
// movimientos cargados. Solo presentación.
export function recordarNombres(
  previos: Readonly<Record<string, string>>,
  items: readonly Actividad[],
): Readonly<Record<string, string>> {
  let siguiente: Record<string, string> | null = null;
  for (const a of items) {
    const v = valorRegistro(a);
    if (v === null) continue;
    const nombre = v === REGISTRADO_POR_OFICINA ? "Oficina" : a.registradoPor.nombre;
    if ((siguiente ?? previos)[v] !== nombre) {
      siguiente ??= { ...previos };
      siguiente[v] = nombre;
    }
  }
  return siguiente ?? previos;
}

// Opciones del filtro "Registró": quienes aparecen en los movimientos cargados,
// sin duplicados, por nombre; "Oficina" al final y solo si hay movimientos de
// oficina. Lo ya seleccionado se conserva aunque no aparezca (un rango nuevo no
// lo deja como valor invisible que oculta todo sin decir por qué).
export function opcionesRegistro(
  items: readonly Actividad[],
  seleccion: readonly string[],
  nombres: Readonly<Record<string, string>> = {},
): OpcionRegistro[] {
  const personas = new Map<string, string>();
  let hayOficina = false;
  for (const a of items) {
    const v = valorRegistro(a);
    if (v === null) continue;
    if (v === REGISTRADO_POR_OFICINA) hayOficina = true;
    else if (!personas.has(v)) personas.set(v, a.registradoPor.nombre);
  }
  for (const [v, nombre] of Object.entries(nombres)) {
    if (v === REGISTRADO_POR_OFICINA) hayOficina = true;
    else if (!personas.has(v)) personas.set(v, nombre);
  }
  for (const v of seleccion) {
    if (v === REGISTRADO_POR_OFICINA) hayOficina = true;
    else if (!personas.has(v)) personas.set(v, nombres[v] ?? "Otra persona");
  }
  const lista = [...personas].map(([valor, etiqueta]) => ({ valor, etiqueta }));
  lista.sort((x, y) => x.etiqueta.localeCompare(y.etiqueta, "es") || x.valor.localeCompare(y.valor));
  if (hayOficina) lista.push({ valor: REGISTRADO_POR_OFICINA, etiqueta: "Oficina" });
  return lista;
}
