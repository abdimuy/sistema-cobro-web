import type { VentaLocal } from "@/services/api/getVentasLocales";
import type {
  CampoCoincidencia,
  Coincidencia,
} from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";

export const COLUMNA_DE_CAMPO: Record<CampoCoincidencia, ColumnId | null> = {
  cliente: "cliente",
  telefono: "telefono",
  folio: "microsipFolio",
  direccion: "direccion",
  articulos: null,
};

export const ETIQUETA_MOTIVO: Record<
  Exclude<CampoCoincidencia, "cliente">,
  string
> = {
  telefono: "teléfono",
  folio: "folio",
  direccion: "dirección",
  articulos: "artículos",
};

const ORDEN: CampoCoincidencia[] = [
  "cliente",
  "telefono",
  "folio",
  "direccion",
  "articulos",
];

function conocidas(venta: VentaLocal): Coincidencia[] {
  return (venta.COINCIDENCIAS ?? []).filter((c) => ORDEN.includes(c.campo));
}

export function coincidenciaDe(
  venta: VentaLocal,
  campo: CampoCoincidencia,
): Coincidencia | undefined {
  return conocidas(venta).find((c) => c.campo === campo);
}

export function motivosDe(
  venta: VentaLocal,
): Array<Exclude<CampoCoincidencia, "cliente">> {
  const presentes = new Set(conocidas(venta).map((c) => c.campo));
  return ORDEN.filter(
    (c): c is Exclude<CampoCoincidencia, "cliente"> =>
      c !== "cliente" && presentes.has(c),
  );
}

export function coincidenciasOcultas(
  venta: VentaLocal,
  visibles: ColumnId[],
): Coincidencia[] {
  const vistos = new Set<CampoCoincidencia>();
  return conocidas(venta).filter((c) => {
    if (vistos.has(c.campo)) return false;
    vistos.add(c.campo);
    const col = COLUMNA_DE_CAMPO[c.campo];
    return col === null || !visibles.includes(col);
  });
}

export function columnaDelBloque(visibles: ColumnId[]): ColumnId | undefined {
  return visibles.includes("cliente") ? "cliente" : visibles[0];
}
