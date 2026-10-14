import type { Actividad } from "../../domain/entities";
import { horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";

// Nombra una actividad por su id para el "Antes/Después" del popover de pausa:
// en la jornada sí se conoce el cliente (en el tablero solo hora y tipo).
export function describirActividades(actividades: readonly Actividad[]) {
  return (id: string): string | null => {
    const a = actividades.find((x) => x.id === id);
    return a
      ? `${horaCorta(a.hora)} · ${TIPO_ACTIVIDAD_META[a.tipo].etiqueta.toLowerCase()} · ${a.clienteNombre}`
      : null;
  };
}

// RefVenta: lo que pide el detalle de venta de Clientes. `doctoPvId` lo manda
// el servidor en cada Actividad (contrato v2); sin él no hay venta que abrir.
export type RefVenta = { readonly clienteId: number; readonly doctoPvId: number };
export type AbrirVenta = (v: RefVenta) => void;

export function refVentaDe(a: Pick<Actividad, "clienteId" | "doctoPvId">): RefVenta | null {
  return a.doctoPvId === null ? null : { clienteId: a.clienteId, doctoPvId: a.doctoPvId };
}
