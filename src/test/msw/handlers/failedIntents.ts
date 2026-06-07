import { http, HttpResponse } from "msw";
import type { FailedIntentDTO } from "../../../modules/failedIntents/infrastructure/mappers/dtoToFailedIntent";
import type { BlobPartsResponseDTO } from "../../../modules/failedIntents/infrastructure/mappers/blobPartsDtoToBundle";

// All failed-intents MSW handlers live here, keyed off the URL pattern
// the production adapter uses. Tests register them via
// `server.use(...failedIntentsHandlers({...}))` and can override any
// single endpoint by calling `server.use(http.get(...))` afterwards.
export const ADMIN_BASE = "*/v2/_admin/failed-intents";

type ReplayResponseDTO = {
  outcome: string;
  replay_http_status: number;
  replay_body_preview: string;
};

type ErrorBody = Record<string, unknown>;

export type FailedIntentsHandlerOptions = {
  list?: {
    items?: FailedIntentDTO[];
    nextCursor?: string;
    hasMore?: boolean;
    assertParams?: (url: URL, headers: Headers) => void;
  };
  get?: {
    byId: Record<string, FailedIntentDTO>;
    onMissing?: () => HttpResponse<ErrorBody>;
  };
  replay?: {
    response?: ReplayResponseDTO;
    assertCall?: (intentId: string, headers: Headers) => void;
    error?: { status: number; body: ErrorBody };
  };
  replayWith?: {
    response?: ReplayResponseDTO;
    assertCall?: (intentId: string, body: unknown) => void;
    error?: { status: number; body: ErrorBody };
  };
  resolve?: {
    response?: FailedIntentDTO;
    assertCall?: (intentId: string, body: unknown) => void;
    error?: { status: number; body: ErrorBody };
  };
  blobParts?: {
    byId: Record<string, BlobPartsResponseDTO>;
    onMissing?: () => HttpResponse<ErrorBody>;
  };
  downloadBlobPart?: {
    // Map of `${intentId}:${index}` → bytes + content-type.
    byKey: Record<string, { bytes: BlobPart; contentType: string }>;
    assertCall?: (intentId: string, index: number) => void;
  };
  replayWithMultipart?: {
    response?: ReplayResponseDTO;
    assertCall?: (intentId: string, body: FormData) => void;
    error?: { status: number; body: ErrorBody };
  };
};

type BlobPart = ArrayBuffer | Uint8Array | string;

export function failedIntentsHandlers(opts: FailedIntentsHandlerOptions = {}) {
  const o = opts;
  return [
    http.get(ADMIN_BASE, ({ request }) => {
      const url = new URL(request.url);
      o.list?.assertParams?.(url, request.headers);
      return HttpResponse.json({
        items: o.list?.items ?? [],
        next_cursor: o.list?.nextCursor ?? "",
        has_more: o.list?.hasMore ?? false,
      });
    }),

    http.get(`${ADMIN_BASE}/:id`, ({ params }) => {
      const id = String(params.id);
      const intent = o.get?.byId?.[id];
      if (!intent) {
        return (
          o.get?.onMissing?.() ??
          HttpResponse.json(
            { code: "failed_intent_not_found", message: "no encontrado" },
            { status: 404 },
          )
        );
      }
      return HttpResponse.json(intent);
    }),

    http.post(`${ADMIN_BASE}/:id/replay`, ({ params, request }) => {
      const id = String(params.id);
      o.replay?.assertCall?.(id, request.headers);
      if (o.replay?.error) {
        return HttpResponse.json(o.replay.error.body, {
          status: o.replay.error.status,
        });
      }
      return HttpResponse.json(
        o.replay?.response ?? {
          outcome: "retried_ok",
          replay_http_status: 201,
          replay_body_preview: '{"ok":true}',
        },
      );
    }),

    http.post(`${ADMIN_BASE}/:id/replay-with`, async ({ params, request }) => {
      const id = String(params.id);
      const body = await request.json();
      o.replayWith?.assertCall?.(id, body);
      if (o.replayWith?.error) {
        return HttpResponse.json(o.replayWith.error.body, {
          status: o.replayWith.error.status,
        });
      }
      return HttpResponse.json(
        o.replayWith?.response ?? {
          outcome: "retried_ok",
          replay_http_status: 201,
          replay_body_preview: '{"ok":true}',
        },
      );
    }),

    http.get(`${ADMIN_BASE}/:id/blob-parts`, ({ params }) => {
      const id = String(params.id);
      const dto = o.blobParts?.byId?.[id];
      if (!dto) {
        return (
          o.blobParts?.onMissing?.() ??
          HttpResponse.json(
            { code: "failed_intent_no_blob", message: "sin blob" },
            { status: 422 },
          )
        );
      }
      return HttpResponse.json(dto);
    }),

    http.get(`${ADMIN_BASE}/:id/blob-parts/:index/download`, ({ params }) => {
      const id = String(params.id);
      const index = Number(params.index);
      o.downloadBlobPart?.assertCall?.(id, index);
      const entry = o.downloadBlobPart?.byKey?.[`${id}:${index}`];
      if (!entry) {
        return HttpResponse.json(
          { code: "part_index_out_of_range", message: "fuera de rango" },
          { status: 422 },
        );
      }
      const body =
        typeof entry.bytes === "string"
          ? new TextEncoder().encode(entry.bytes)
          : entry.bytes;
      return new HttpResponse(body as BodyInit, {
        status: 200,
        headers: { "Content-Type": entry.contentType },
      });
    }),

    http.post(`${ADMIN_BASE}/:id/replay-with-multipart`, async ({ params, request }) => {
      const id = String(params.id);
      const fd = await request.formData();
      o.replayWithMultipart?.assertCall?.(id, fd);
      if (o.replayWithMultipart?.error) {
        return HttpResponse.json(o.replayWithMultipart.error.body, {
          status: o.replayWithMultipart.error.status,
        });
      }
      return HttpResponse.json(
        o.replayWithMultipart?.response ?? {
          outcome: "retried_ok",
          replay_http_status: 201,
          replay_body_preview: '{"ok":true}',
        },
      );
    }),

    http.patch(`${ADMIN_BASE}/:id/resolve`, async ({ params, request }) => {
      const id = String(params.id);
      const body = await request.json();
      o.resolve?.assertCall?.(id, body);
      if (o.resolve?.error) {
        return HttpResponse.json(o.resolve.error.body, {
          status: o.resolve.error.status,
        });
      }
      if (o.resolve?.response) return HttpResponse.json(o.resolve.response);
      return HttpResponse.json(
        {
          code: "missing_handler_response",
          message: "test forgot to register a resolve response",
        },
        { status: 500 },
      );
    }),
  ];
}
