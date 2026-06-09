import type { VentaEvento } from "../../domain/entities/VentaEvento";

export interface VentaEventosPort {
  obtenerEventos(ventaID: string, signal?: AbortSignal): Promise<VentaEvento[]>;
}
