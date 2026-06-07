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

  // Multipart edit path — implemented in the next infrastructure commit.
  // Stubs throw so a misconfigured caller fails loud instead of silently
  // returning bad data.
  async getBlobParts(_intentId: string, _signal?: AbortSignal): Promise<BlobPartsBundle> {
    throw new DomainError(
      "not_implemented",
      "getBlobParts aún no está implementado",
    );
  }
  async downloadBlobPart(_intentId: string, _index: number, _signal?: AbortSignal): Promise<Blob> {
    throw new DomainError(
      "not_implemented",
      "downloadBlobPart aún no está implementado",
    );
  }
  async replayWithMultipart(
    _intentId: string,
    _manifest: Manifest,
    _uploads: UploadMap,
  ): Promise<ReplayResult> {
    throw new DomainError(
      "not_implemented",
      "replayWithMultipart aún no está implementado",
    );
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
