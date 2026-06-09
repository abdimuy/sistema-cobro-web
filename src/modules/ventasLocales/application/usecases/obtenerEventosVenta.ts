import type { VentaEventosPort } from "../ports/VentaEventosPort";
import type { VentaEvento } from "../../domain/entities/VentaEvento";

export async function obtenerEventosVenta(
  port: VentaEventosPort,
  ventaID: string,
  signal?: AbortSignal,
): Promise<VentaEvento[]> {
  return port.obtenerEventos(ventaID, signal);
}
