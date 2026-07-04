// SortByVenta mirrors the backend sort_by enum for GET /v2/ventas. It is the
// only allowed set — ciudad/tipoVenta sorting from the legacy UI has no
// backend equivalent and must be dropped at the presentation layer instead
// of forwarded here.
export type SortByVenta = "fecha_venta" | "precio_total" | "nombre_cliente";

export type BuscarVentasInput = {
  readonly search?: string;
  readonly tipoVenta?: "CONTADO" | "CREDITO";
  readonly situacion?: "borrador" | "revisada" | "aprobada" | "cancelada";
  readonly sincronizacion?: "pendiente" | "aplicada";
  readonly zonaClienteId?: number;
  readonly vendedorEmail?: string;
  // almacenId has NO backend filter (GET /v2/ventas does not accept it). Kept
  // here only so callers built from the legacy VentasParams shape type-check;
  // HttpVentasListAdapter must never send it.
  readonly almacenId?: number;
  readonly precioMin?: number;
  readonly precioMax?: number;
  readonly fechaInicio?: string;
  readonly fechaFin?: string;
  readonly incluirCanceladas?: boolean;
  readonly sortBy?: SortByVenta;
  readonly sortOrder?: "asc" | "desc";
  readonly cursor?: string;
  readonly limit?: number;
};
