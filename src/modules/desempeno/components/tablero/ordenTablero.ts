import type { UsuarioTablero } from "../../domain/entities";
import { sinAcentos } from "../lib/format";

// Orden y búsqueda de filas YA recibidas. Number() sobre los decimales del API
// solo sirve para comparar; ninguna cifra se calcula aquí (D10).

export type ClaveOrdenTablero =
  | "nombre"
  | "zona"
  | "ahora"
  | "horas"
  | "pausas"
  | "pagos"
  | "visitas"
  | "faltan"
  | "cobro";

export type OrdenTablero = { clave: ClaveOrdenTablero; dir: 1 | -1 };

// Al abrir se ordena por zona (así se reparte el trabajo); la columna
// "Cobrador" ordena por nombre. Ningún encabezado se marca hasta elegir uno.
export const ORDEN_TABLERO_INICIAL: OrdenTablero = { clave: "zona", dir: 1 };

const ASCENDENTES: readonly ClaveOrdenTablero[] = ["nombre", "zona", "ahora", "faltan"];
const RANGO_AHORA = { activo: 0, sin_actividad: 1, no_ha_empezado: 2 } as const;

// null = sin dato (p. ej. % de cobro sin esperado): siempre al final.
function valor(u: UsuarioTablero, clave: ClaveOrdenTablero): string | number | null {
  switch (clave) {
    case "nombre":
      return u.nombre;
    case "zona":
      return u.zonaNombre ?? "";
    case "ahora":
      return RANGO_AHORA[u.estadoAhora];
    case "horas":
      return u.minutosActivos;
    case "pausas":
      return u.pausas.minutos;
    case "pagos":
      return Number(u.pagos.importe);
    case "visitas":
      return u.visitas;
    case "faltan":
      return u.coberturaPorSegmento.sinNada;
    case "cobro":
      return u.cobro.pct === null ? null : Number(u.cobro.pct);
  }
}

export function ordenarUsuarios(
  usuarios: readonly UsuarioTablero[],
  orden: OrdenTablero,
): UsuarioTablero[] {
  return [...usuarios].sort((a, b) => {
    const x = valor(a, orden.clave);
    const y = valor(b, orden.clave);
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    const c =
      typeof x === "string" && typeof y === "string"
        ? x.localeCompare(y, "es", { numeric: true })
        : (x as number) - (y as number);
    return c * orden.dir;
  });
}

export function filtrarUsuarios(usuarios: readonly UsuarioTablero[], q: string): UsuarioTablero[] {
  const buscado = sinAcentos(q.trim());
  if (buscado === "") return [...usuarios];
  return usuarios.filter((u) =>
    sinAcentos(`${u.nombre} ${u.zonaNombre ?? ""} ${u.email}`).includes(buscado),
  );
}

export function siguienteOrden(actual: OrdenTablero, clave: ClaveOrdenTablero): OrdenTablero {
  if (actual.clave === clave) return { clave, dir: actual.dir === 1 ? -1 : 1 };
  return { clave, dir: ASCENDENTES.includes(clave) ? 1 : -1 };
}
