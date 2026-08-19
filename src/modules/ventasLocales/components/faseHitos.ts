import type { VentaEvento } from "../domain/entities/VentaEvento";

/**
 * Los hitos del carril, reconstruidos con la bitácora real de la venta. Un hito
 * sin fecha está pendiente y se dibuja con el punto hueco.
 */
export interface FaseHito {
  clave: "capturada" | "revisada" | "aprobada" | "aplicada" | "cancelada";
  nombre: string;
  fecha: Date | null;
}

const CARRIL: ReadonlyArray<{
  clave: FaseHito["clave"];
  nombre: string;
  tipo: string;
}> = [
  { clave: "capturada", nombre: "Capturada", tipo: "venta.creada" },
  { clave: "revisada", nombre: "Revisada", tipo: "venta.enviada_a_revision" },
  { clave: "aprobada", nombre: "Aprobada", tipo: "venta.aprobada" },
  { clave: "aplicada", nombre: "Aplicada en Microsip", tipo: "venta.aplicada" },
];

/**
 * Última ocurrencia del tipo: una venta puede regresarse a borrador y volver a
 * aprobarse, y lo que cuenta es la vuelta vigente.
 */
function ultimaFecha(eventos: VentaEvento[], tipo: string): Date | null {
  let ultima: Date | null = null;
  for (const evento of eventos) {
    if (evento.eventType !== tipo) continue;
    if (ultima === null || evento.occurredAt.getTime() > ultima.getTime()) {
      ultima = evento.occurredAt;
    }
  }
  return ultima;
}

export function faseHitos(eventos: VentaEvento[]): FaseHito[] {
  const carril: FaseHito[] = CARRIL.map((h) => ({
    clave: h.clave,
    nombre: h.nombre,
    fecha: ultimaFecha(eventos, h.tipo),
  }));

  const cancelada = ultimaFecha(eventos, "venta.cancelada");
  if (cancelada) {
    // Cancelada cierra la historia: los pendientes ya no van a ocurrir.
    return [
      ...carril.filter((h) => h.fecha !== null),
      { clave: "cancelada", nombre: "Cancelada", fecha: cancelada },
    ];
  }

  return carril;
}
