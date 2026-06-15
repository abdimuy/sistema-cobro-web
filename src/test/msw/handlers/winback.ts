import { http, HttpResponse } from "msw";
import type {
  WinbackItemDTO,
  AttributionDTO,
  RefreshResponseDTO,
} from "../../../modules/winback/infrastructure/http/dtos";

// All winback MSW handlers live here, keyed off the URL pattern the
// production adapter uses. Tests register them via
// `server.use(...winbackHandlers({...}))` and can override any single
// endpoint by calling `server.use(http.get(...))` afterwards.
export const WINBACK_BASE = "*/v2/analytics/winback";

type ErrorBody = Record<string, unknown>;

export type WinbackHandlerOptions = {
  list?: {
    items?: WinbackItemDTO[];
    assertParams?: (url: URL, headers: Headers) => void;
  };
  attribution?: {
    response?: AttributionDTO;
    assertParams?: (url: URL, headers: Headers) => void;
  };
  refresh?: {
    response?: RefreshResponseDTO;
    assertCall?: (body: unknown) => void;
    error?: { status: number; body: ErrorBody };
  };
};

const DEFAULT_ATTRIBUTION: AttributionDTO = {
  treatment_total: 0,
  treatment_convertidos: 0,
  control_total: 0,
  control_convertidos: 0,
  tasa_treatment: "0.00",
  tasa_control: "0.00",
  uplift: "0.00",
};

export function winbackHandlers(opts: WinbackHandlerOptions = {}) {
  const o = opts;
  return [
    http.get(WINBACK_BASE, ({ request }) => {
      const url = new URL(request.url);
      o.list?.assertParams?.(url, request.headers);
      return HttpResponse.json({
        items: o.list?.items ?? [],
      });
    }),

    http.get(`${WINBACK_BASE}/attribution`, ({ request }) => {
      const url = new URL(request.url);
      o.attribution?.assertParams?.(url, request.headers);
      return HttpResponse.json(o.attribution?.response ?? DEFAULT_ATTRIBUTION);
    }),

    http.post(`${WINBACK_BASE}/refresh`, async ({ request }) => {
      const body = await request.json();
      o.refresh?.assertCall?.(body);
      if (o.refresh?.error) {
        return HttpResponse.json(o.refresh.error.body, {
          status: o.refresh.error.status,
        });
      }
      return HttpResponse.json(
        o.refresh?.response ?? {
          estado: "iniciado",
          mensaje: "refresh enqueued",
        },
      );
    }),
  ];
}
