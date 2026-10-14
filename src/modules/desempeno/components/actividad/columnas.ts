import type { OrdenActividad } from "../../domain/entities";
import type { ClaveColumna } from "../../presentation/actividadPreferencias";

// Solo las columnas que el contrato puede llenar. `orden` = valor de `orden`
// del API (contrato §4); null = no ordenable en el servidor.
export const COLUMNAS: ReadonlyArray<{
  clave: ClaveColumna;
  titulo: string;
  orden: OrdenActividad | null;
  derecha?: boolean;
}> = [
  { clave: "tipo", titulo: "Tipo", orden: "tipo" },
  { clave: "hora", titulo: "Fecha y hora", orden: "hora" },
  { clave: "cliente", titulo: "Cliente", orden: "cliente" },
  { clave: "venta", titulo: "Venta", orden: null },
  { clave: "monto", titulo: "Monto o resultado", orden: "monto", derecha: true },
  { clave: "forma", titulo: "Forma de cobro", orden: null },
  { clave: "registro", titulo: "Registró", orden: "registrado_por" },
  { clave: "llegada", titulo: "Llegó al servidor", orden: null },
  { clave: "fotos", titulo: "Fotos", orden: null },
  { clave: "gps", titulo: "GPS", orden: null },
];
