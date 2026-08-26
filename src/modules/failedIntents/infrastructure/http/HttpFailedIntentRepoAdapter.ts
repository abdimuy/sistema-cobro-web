import type { AxiosInstance } from "axios";

import type {
  FailedIntent,
  BlobPartsBundle,
  Manifest,
} from "../../domain/entities";
import { ReplayOutcome } from "../../domain/values";
import { DomainError } from "../../domain/errors";
import type { FailedIntentRepoPort } from "../../application/ports/FailedIntentRepoPort";
import type {
  ListInput,
  ListOutput,
  ResolveInput,
  ReplayResult,
  UploadMap,
} from "../../application/dto";

import {
  dtoToFailedIntent,
  type FailedIntentDTO,
} from "../mappers/dtoToFailedIntent";
import { domainToResolveBody } from "../mappers/domainToResolveBody";
import { apperrorToDomainError } from "../mappers/apperrorToDomainError";
import {
  blobPartsDtoToBundle,
  type BlobPartsResponseDTO,
} from "../mappers/blobPartsDtoToBundle";
import { manifestToFormData } from "../mappers/manifestToFormData";

type ListResponseDTO = {
  items: FailedIntentDTO[];
  next_cursor: string;
  has_more: boolean;
};

type ReplayResponseDTO = {
  outcome: string;
  replay_http_status: number;
  replay_body_preview: string;
};

const ADMIN_BASE = "/_admin/failed-intents";

// HttpFailedIntentRepoAdapter is the production implementation of the
// outbound port — it talks to /v2/_admin/failed-intents via the axios
// client (which injects the Firebase Bearer token).
//
// Every method funnels errors through apperrorToDomainError so the
// upper layers only ever see DomainError instances.
export class HttpFailedIntentRepoAdapter implements FailedIntentRepoPort {
  constructor(private readonly client: AxiosInstance) {}

  async list(input: ListInput, signal?: AbortSignal): Promise<ListOutput> {
    try {
      const params: Record<string, string | number> = {};
      if (input.status) params.status = input.status;
      if (input.modulo) params.modulo = input.modulo;
      if (input.cursor) params.cursor = input.cursor;
      if (input.pageSize !== undefined) params.page_size = input.pageSize;

      const { data } = await this.client.get<ListResponseDTO>(ADMIN_BASE, {
        params,
        signal,
      });

      return {
        items: data.items.map(dtoToFailedIntent),
        nextCursor: data.next_cursor ? data.next_cursor : null,
        hasMore: data.has_more,
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async get(intentId: string, signal?: AbortSignal): Promise<FailedIntent> {
    try {
      const { data } = await this.client.get<FailedIntentDTO>(
        `${ADMIN_BASE}/${encodeURIComponent(intentId)}`,
        { signal },
      );
      return dtoToFailedIntent(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async replay(intentId: string): Promise<ReplayResult> {
    try {
      const { data } = await this.client.post<ReplayResponseDTO>(
        `${ADMIN_BASE}/${encodeURIComponent(intentId)}/replay`,
      );
      return this.parseReplay(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async replayWith(intentId: string, body: unknown): Promise<ReplayResult> {
    try {
      const { data } = await this.client.post<ReplayResponseDTO>(
        `${ADMIN_BASE}/${encodeURIComponent(intentId)}/replay-with`,
        { body },
      );
      return this.parseReplay(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async getBlobParts(
    intentId: string,
    signal?: AbortSignal,
  ): Promise<BlobPartsBundle> {
    try {
      const { data } = await this.client.get<BlobPartsResponseDTO>(
        `${ADMIN_BASE}/${encodeURIComponent(intentId)}/blob-parts`,
        { signal },
      );
      return blobPartsDtoToBundle(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async downloadBlobPart(
    intentId: string,
    index: number,
    signal?: AbortSignal,
  ): Promise<Blob> {
    try {
      // arraybuffer + manual Blob wrap is more portable than responseType:
      // 'blob' which behaves inconsistently in jsdom/test environments.
      const response = await this.client.get<ArrayBuffer>(
        `${ADMIN_BASE}/${encodeURIComponent(intentId)}/blob-parts/${index}/download`,
        { signal, responseType: "arraybuffer" },
      );
      const ct =
        response.headers["content-type"] ?? "application/octet-stream";
      return new Blob([response.data], { type: ct });
    } catch (e) {
      // axios returns the error body as ArrayBuffer too when responseType is
      // arraybuffer; decode it before handing off to the apperror mapper so
      // codes / messages survive.
      throw apperrorToDomainError(normalizeBinaryError(e));
    }
  }

  async replayWithMultipart(
    intentId: string,
    manifest: Manifest,
    uploads: UploadMap,
  ): Promise<ReplayResult> {
    // We bypass axios for this one path because its FormData detection
    // behaves inconsistently across node, jsdom, and real browsers
    // (sometimes the multipart boundary header isn't set). The Fetch
    // API encodes FormData uniformly. We still piggy-back on the axios
    // baseURL + auth interceptor by reading them off the client instance.
    const fd = manifestToFormData(manifest, uploads);
    const url =
      String(this.client.defaults.baseURL ?? "") +
      `${ADMIN_BASE}/${encodeURIComponent(intentId)}/replay-with-multipart`;

    // Mirror the apiClient's Bearer-token interceptor.
    const headers: Record<string, string> = {};
    try {
      const { auth } = await import("../../../../../firebase");
      const token = await auth.currentUser?.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // In tests without a firebase module the token is simply omitted.
    }

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        body: fd,
        headers,
      });
    } catch (e) {
      throw apperrorToDomainError(e);
    }

    if (!resp.ok) {
      // Build an axios-error-shaped object so the apperror mapper handles
      // it the same way as the other endpoints — the body's `code` field
      // is what matters.
      let parsed: unknown = {};
      try {
        parsed = await resp.json();
      } catch {
        /* leave empty */
      }
      throw apperrorToDomainError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({
          isAxiosError: true,
          response: { status: resp.status, data: parsed },
          message: resp.statusText,
        } as any),
      );
    }

    const dto = (await resp.json()) as ReplayResponseDTO;
    return this.parseReplay(dto);
  }

  async resolve(input: ResolveInput): Promise<FailedIntent> {
    try {
      const { data } = await this.client.patch<FailedIntentDTO>(
        `${ADMIN_BASE}/${encodeURIComponent(input.intentId)}/resolve`,
        domainToResolveBody(input),
      );
      return dtoToFailedIntent(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  private parseReplay(dto: ReplayResponseDTO): ReplayResult {
    const outcome = ReplayOutcome.create(dto.outcome);
    if (outcome instanceof DomainError) throw outcome;
    return {
      outcome,
      replayHttpStatus: dto.replay_http_status,
      replayBodyPreview: dto.replay_body_preview,
    };
  }
}

// normalizeBinaryError decodes an axios error whose response.data is an
// ArrayBuffer (the price of responseType: 'arraybuffer') back into a
// JSON object so apperrorToDomainError can pull the code out.
function normalizeBinaryError(e: unknown): unknown {
  if (typeof e !== "object" || e === null) return e;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ax = e as any;
  const buf = ax?.response?.data;
  if (buf && (buf instanceof ArrayBuffer || ArrayBuffer.isView(buf))) {
    try {
      const text = new TextDecoder().decode(
        buf instanceof ArrayBuffer ? new Uint8Array(buf) : (buf as Uint8Array),
      );
      ax.response.data = JSON.parse(text);
    } catch {
      // Leave as is; the mapper will fall through to http_<status>.
    }
  }
  return e;
}
