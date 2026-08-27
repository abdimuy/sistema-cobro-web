import { http, HttpResponse, type RequestHandler } from "msw";
import type { VentaV2 } from "../../../services/api/ventaV2Types";

// Handlers de la edición de líneas de una venta.
//
// Los dos endpoints viejos (PUT /combos y PUT /productos) siguen existiendo en
// el servidor pero la pantalla ya no debe llamarlos. Aquí quedan registrados
// como TRAMPAS: si alguien los llama, la petición queda contada y responde 500,
// para que la prueba falle de forma ruidosa en vez de pasar por casualidad.

export const VENTAS_BASE = "*/v2/ventas";

export type LlamadasEdicion = {
  lineas: Array<{ ventaID: string; body: unknown }>;
  combos: number;
  productos: number;
  /**
   * PATCH /v2/ventas/{id} — la cabecera. Se cuenta para poder afirmar lo
   * contrario de lo habitual: que un cambio que NO toca líneas guarda bien y
   * deja `lineas` en cero. Sin este handler la petición quedaba sin cubrir y
   * MSW la convertía en error, así que ese flujo no se podía probar.
   */
  header: number;
};

export type VentasEditHandlerOptions = {
  /** Venta devuelta por PUT /lineas cuando no hay error. */
  respuesta?: VentaV2;
  /** Cuando viene, PUT /lineas responde con este error en vez de 200. */
  error?: { status: number; body: Record<string, unknown> };
};

/**
 * Error tal como lo arma el servidor Go: Huma RFC 7807 con el mensaje en
 * español en `detail` y el código de dominio en `errors[].message` como
 * `code=<codigo>` (ver internal/ventas/infra/venthttp/auth.go, mapAppError).
 */
export function errorHuma(
  status: number,
  title: string,
  code: string,
  detail: string,
): { status: number; body: Record<string, unknown> } {
  return {
    status,
    body: { title, status, detail, errors: [{ message: `code=${code}` }] },
  };
}

export function ventasEditHandlers(
  opts: VentasEditHandlerOptions = {},
): { handlers: RequestHandler[]; llamadas: LlamadasEdicion } {
  const llamadas: LlamadasEdicion = { lineas: [], combos: 0, productos: 0, header: 0 };

  const handlers: RequestHandler[] = [
    http.patch(`${VENTAS_BASE}/:id`, () => {
      llamadas.header++;
      return HttpResponse.json(opts.respuesta ?? {}, { status: 200 });
    }),

    http.put(`${VENTAS_BASE}/:id/lineas`, async ({ params, request }) => {
      const body = await request.json();
      llamadas.lineas.push({ ventaID: String(params.id), body });
      if (opts.error) {
        return HttpResponse.json(opts.error.body, { status: opts.error.status });
      }
      return HttpResponse.json(opts.respuesta ?? {}, { status: 200 });
    }),

    // Trampas: endpoints desaconsejados que esta pantalla ya no usa.
    http.put(`${VENTAS_BASE}/:id/combos`, () => {
      llamadas.combos++;
      return HttpResponse.json({ detail: "PUT /combos no debe usarse" }, { status: 500 });
    }),
    http.put(`${VENTAS_BASE}/:id/productos`, () => {
      llamadas.productos++;
      return HttpResponse.json({ detail: "PUT /productos no debe usarse" }, { status: 500 });
    }),
  ];

  return { handlers, llamadas };
}
