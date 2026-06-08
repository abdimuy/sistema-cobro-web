import type { VentaV2 } from "@/services/api/ventaV2Types";
import { crearVentaBodyToVentaV2WithCorrections } from "./crearVentaBodyToVentaV2WithCorrections";

// crearVentaBodyToVentaV2 is the corrections-less convenience wrapper
// over crearVentaBodyToVentaV2WithCorrections. Callers that just need
// the VentaV2 (e.g. the PLACEHOLDER_VENTA in useVentaReplayEdit) use
// this; callers that want to surface the audit trail import the
// WithCorrections variant directly.

export function crearVentaBodyToVentaV2(body: unknown): VentaV2 | null {
  return crearVentaBodyToVentaV2WithCorrections(body).venta;
}
