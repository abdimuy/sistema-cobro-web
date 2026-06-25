import type {
  ProductoVenta,
  ReporteUsuario,
  Ruta,
  VentaCobranza,
} from "../../domain/entities";

// DesgloseCobranza is the shared shape of the per-venta breakdown response,
// used both per-zona and per-user.
export type DesgloseCobranza = {
  fechaInicioSemana: string | null;
  ventas: VentaCobranza[];
  resumen: { numerador: string; denominador: number; pctPonderado: string | null };
};

// RutasPort is the outbound interface the rutas module requires from its host.
// The HTTP adapter satisfies it for production; an in-memory fake satisfies it
// for tests. No filtering — the backend returns all rows for the current user.
export interface RutasPort {
  listarRutas(signal?: AbortSignal): Promise<Ruta[]>;
  listarReporteUsuarios(signal?: AbortSignal): Promise<ReporteUsuario[]>;
  desgloseCobranza(
    zonaId: number,
    signal?: AbortSignal,
  ): Promise<DesgloseCobranza>;
  desgloseCobranzaPorUsuario(
    uid: string,
    signal?: AbortSignal,
  ): Promise<DesgloseCobranza>;
  obtenerProductos(
    clienteId: number,
    doctoPvId: number,
    signal?: AbortSignal,
  ): Promise<ProductoVenta[]>;
}
