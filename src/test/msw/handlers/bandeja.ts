import { http, HttpResponse } from "msw";
import type {
  ConversacionDetalleResponseDTO,
  ConversacionResumenDTO,
  DecisionResultDTO,
  DictarResponseDTO,
  OkResponseDTO,
} from "../../../modules/bandeja/infrastructure/http/dtos";

// All bandeja MSW handlers live here, keyed off the URL pattern the
// production adapter (HttpBandejaAdapter) uses. Tests register them via
// `server.use(...bandejaHandlers({...}))` and can override any single
// endpoint afterwards with `server.use(http.get(...))`.
export const BANDEJA_BASE = "*/v2/reactivacion/conversaciones";

type ErrorBody = Record<string, unknown>;

export type BandejaHandlerOptions = {
  list?: {
    items?: ConversacionResumenDTO[];
    assertParams?: (url: URL) => void;
  };
  detalle?: {
    byId?: Record<number, ConversacionDetalleResponseDTO>;
    onMissing?: () => HttpResponse<ErrorBody>;
    assertCall?: (clienteId: number) => void;
  };
  aprobar?: {
    assertCall?: (clienteId: number) => void;
    error?: { status: number; body: ErrorBody };
  };
  editar?: {
    assertCall?: (clienteId: number, texto: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  dictar?: {
    response?: DictarResponseDTO;
    assertCall?: (clienteId: number, intencion: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  escalar?: {
    assertCall?: (clienteId: number, asignadoA: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  simular?: {
    response?: DecisionResultDTO;
    assertCall?: (clienteId: number, mensaje: string) => void;
    error?: { status: number; body: ErrorBody };
  };
};

export function bandejaHandlers(opts: BandejaHandlerOptions = {}) {
  const o = opts;
  return [
    http.get(BANDEJA_BASE, ({ request }) => {
      const url = new URL(request.url);
      o.list?.assertParams?.(url);
      return HttpResponse.json({ items: o.list?.items ?? [] });
    }),

    http.get(`${BANDEJA_BASE}/:id`, ({ params }) => {
      const id = Number(params.id);
      o.detalle?.assertCall?.(id);
      const detalle = o.detalle?.byId?.[id];
      if (!detalle) {
        return (
          o.detalle?.onMissing?.() ??
          HttpResponse.json(
            { code: "reactivacion_conversacion_no_encontrada", message: "no encontrada" },
            { status: 404 },
          )
        );
      }
      return HttpResponse.json(detalle);
    }),

    http.post(`${BANDEJA_BASE}/:id/aprobar`, ({ params }) => {
      const id = Number(params.id);
      o.aprobar?.assertCall?.(id);
      if (o.aprobar?.error) {
        return HttpResponse.json(o.aprobar.error.body, { status: o.aprobar.error.status });
      }
      return HttpResponse.json({ ok: true } satisfies OkResponseDTO);
    }),

    http.post(`${BANDEJA_BASE}/:id/editar`, async ({ params, request }) => {
      const id = Number(params.id);
      const body = (await request.json()) as { texto: string };
      o.editar?.assertCall?.(id, body.texto);
      if (o.editar?.error) {
        return HttpResponse.json(o.editar.error.body, { status: o.editar.error.status });
      }
      return HttpResponse.json({ ok: true } satisfies OkResponseDTO);
    }),

    http.post(`${BANDEJA_BASE}/:id/dictar`, async ({ params, request }) => {
      const id = Number(params.id);
      const body = (await request.json()) as { intencion: string };
      o.dictar?.assertCall?.(id, body.intencion);
      if (o.dictar?.error) {
        return HttpResponse.json(o.dictar.error.body, { status: o.dictar.error.status });
      }
      return HttpResponse.json(o.dictar?.response ?? { borrador: "nuevo borrador" });
    }),

    http.post(`${BANDEJA_BASE}/:id/escalar`, async ({ params, request }) => {
      const id = Number(params.id);
      const body = (await request.json()) as { asignado_a?: string };
      o.escalar?.assertCall?.(id, body.asignado_a ?? "");
      if (o.escalar?.error) {
        return HttpResponse.json(o.escalar.error.body, { status: o.escalar.error.status });
      }
      return HttpResponse.json({ ok: true } satisfies OkResponseDTO);
    }),

    http.post(`${BANDEJA_BASE}/:id/mensaje-entrante`, async ({ params, request }) => {
      const id = Number(params.id);
      const body = (await request.json()) as { mensaje: string };
      o.simular?.assertCall?.(id, body.mensaje);
      if (o.simular?.error) {
        return HttpResponse.json(o.simular.error.body, { status: o.simular.error.status });
      }
      return HttpResponse.json(
        o.simular?.response ?? {
          intencion: "",
          confianza: 0,
          senales: [],
          accion: "",
          borrador: "",
          evidencia: [],
          razon_escalamiento: "",
          resultado: "",
          escalada: false,
        },
      );
    }),
  ];
}
