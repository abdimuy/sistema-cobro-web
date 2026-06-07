// isVentaShapedBody is a structural type guard: it accepts an unknown
// JSON body and returns true when the body has the minimum shape that
// POST /v2/ventas would accept (mirrors CrearVentaBody in
// internal/ventas/infra/venthttp/dto.go). It does NOT validate values
// (decimal-string format, GPS bounds, enum membership beyond
// tipo_venta) — that is the form's job: the form surfaces bad values
// as per-field errors so the operator can fix them.
//
// Used by VentaReplayForm to decide whether the venta form can drive
// editing or the raw-JSON textarea must be shown as fallback.

const REQUIRED_DIRECCION_KEYS = ["calle", "colonia", "poblacion", "ciudad"] as const;
const REQUIRED_MONTOS_KEYS = ["anual", "corto_plazo", "contado"] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isVentaShapedBody(body: unknown): boolean {
  if (!isRecord(body)) return false;

  const cliente = body.cliente;
  if (!isRecord(cliente) || typeof cliente.nombre !== "string") return false;

  const direccion = body.direccion;
  if (!isRecord(direccion)) return false;
  for (const key of REQUIRED_DIRECCION_KEYS) {
    if (typeof direccion[key] !== "string") return false;
  }

  const gps = body.gps;
  if (!isRecord(gps)) return false;
  if (typeof gps.latitud !== "number" || typeof gps.longitud !== "number") return false;

  if (typeof body.fecha_venta !== "string") return false;

  if (body.tipo_venta !== "CONTADO" && body.tipo_venta !== "CREDITO") return false;

  const montos = body.montos;
  if (!isRecord(montos)) return false;
  for (const key of REQUIRED_MONTOS_KEYS) {
    if (typeof montos[key] !== "string") return false;
  }

  const productos = body.productos;
  if (!Array.isArray(productos) || productos.length === 0) return false;

  const vendedores = body.vendedores;
  if (!Array.isArray(vendedores) || vendedores.length === 0) return false;

  return true;
}
