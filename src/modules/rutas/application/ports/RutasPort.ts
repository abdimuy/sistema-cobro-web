import type { Ruta, VentaCobranza } from "../../domain/entities";

// RutasPort is the outbound interface the rutas module requires from its host.
// The HTTP adapter satisfies it for production; an in-memory fake satisfies it
// for tests. No filtering — the backend returns all zonas for the current user.
export interface RutasPort {
  listarRutas(signal?: AbortSignal): Promise<Ruta[]>;
  desgloseCobranza(
    zonaId: number,
    signal?: AbortSignal,
  ): Promise<{ fechaInicioSemana: string | null; ventas: VentaCobranza[] }>;
}
