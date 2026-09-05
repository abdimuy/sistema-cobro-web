import type {
  FailedIntent,
  BlobPartsBundle,
  Manifest,
} from "../../domain/entities";
import {
  IntentStatus,
  HttpMethod,
  ReplayOutcome,
} from "../../domain/values";
import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type {
  ListInput,
  ListOutput,
  ResolveInput,
  ReplayResult,
  UploadMap,
} from "../dto";

// FakeRepoPort is a hand-rolled in-memory implementation of
// FailedIntentRepoPort that records every call. Use-case tests use it to
// assert the use case forwarded the input it received, without standing
// up MSW.
export class FakeRepoPort implements FailedIntentRepoPort {
  listCalls: Array<{ input: ListInput; signal?: AbortSignal }> = [];
  getCalls: Array<{ intentId: string }> = [];
  replayCalls: Array<{ intentId: string }> = [];
  replayWithCalls: Array<{ intentId: string; body: unknown }> = [];
  resolveCalls: Array<{ input: ResolveInput }> = [];
  getBlobPartsCalls: Array<{ intentId: string }> = [];
  downloadBlobPartCalls: Array<{ intentId: string; index: number }> = [];
  replayWithMultipartCalls: Array<{
    intentId: string;
    manifest: Manifest;
    uploads: UploadMap;
  }> = [];

  listResponse: ListOutput | (() => ListOutput) = {
    items: [],
    nextCursor: null,
    hasMore: false,
  };
  getResponse: FailedIntent | (() => FailedIntent) = makeFakeIntent();
  replayResponse: ReplayResult | (() => ReplayResult) = {
    outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
    replayHttpStatus: 201,
    replayBodyPreview: '{"ok":true}',
  };
  replayWithResponse: ReplayResult | (() => ReplayResult) = {
    outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
    replayHttpStatus: 201,
    replayBodyPreview: '{"ok":true}',
  };
  resolveResponse: FailedIntent | (() => FailedIntent) = makeFakeIntent({
    status: IntentStatus.create("ignored") as IntentStatus,
    notes: "test",
  });
  getBlobPartsResponse: BlobPartsBundle | (() => BlobPartsBundle) = {
    contentType: "multipart/form-data; boundary=---test",
    parts: [],
  };
  downloadBlobPartResponse: Blob | (() => Blob) = new Blob(["test bytes"], {
    type: "application/octet-stream",
  });
  replayWithMultipartResponse: ReplayResult | (() => ReplayResult) = {
    outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
    replayHttpStatus: 201,
    replayBodyPreview: '{"ok":true}',
  };

  // When set, the next call to the matching method throws this error.
  throwOnNext: Partial<Record<keyof FailedIntentRepoPort, Error>> = {};

  async list(input: ListInput, signal?: AbortSignal): Promise<ListOutput> {
    this.listCalls.push({ input, signal });
    const e = this.takeThrow("list");
    if (e) throw e;
    return resolve(this.listResponse);
  }
  async get(intentId: string): Promise<FailedIntent> {
    this.getCalls.push({ intentId });
    const e = this.takeThrow("get");
    if (e) throw e;
    return resolve(this.getResponse);
  }
  async replay(intentId: string): Promise<ReplayResult> {
    this.replayCalls.push({ intentId });
    const e = this.takeThrow("replay");
    if (e) throw e;
    return resolve(this.replayResponse);
  }
  async replayWith(intentId: string, body: unknown): Promise<ReplayResult> {
    this.replayWithCalls.push({ intentId, body });
    const e = this.takeThrow("replayWith");
    if (e) throw e;
    return resolve(this.replayWithResponse);
  }
  async resolve(input: ResolveInput): Promise<FailedIntent> {
    this.resolveCalls.push({ input });
    const e = this.takeThrow("resolve");
    if (e) throw e;
    return resolve(this.resolveResponse);
  }
  async getBlobParts(intentId: string): Promise<BlobPartsBundle> {
    this.getBlobPartsCalls.push({ intentId });
    const e = this.takeThrow("getBlobParts");
    if (e) throw e;
    return resolve(this.getBlobPartsResponse);
  }
  async downloadBlobPart(intentId: string, index: number): Promise<Blob> {
    this.downloadBlobPartCalls.push({ intentId, index });
    const e = this.takeThrow("downloadBlobPart");
    if (e) throw e;
    return resolve(this.downloadBlobPartResponse);
  }
  async replayWithMultipart(
    intentId: string,
    manifest: Manifest,
    uploads: UploadMap,
  ): Promise<ReplayResult> {
    this.replayWithMultipartCalls.push({ intentId, manifest, uploads });
    const e = this.takeThrow("replayWithMultipart");
    if (e) throw e;
    return resolve(this.replayWithMultipartResponse);
  }

  private takeThrow(method: keyof FailedIntentRepoPort): Error | undefined {
    const e = this.throwOnNext[method];
    if (e) {
      delete this.throwOnNext[method];
      return e;
    }
    return undefined;
  }
}

function resolve<T>(v: T | (() => T)): T {
  return typeof v === "function" ? (v as () => T)() : v;
}

export function makeFakeIntent(overrides: Partial<FailedIntent> = {}): FailedIntent {
  const base: FailedIntent = {
    id: "11111111-1111-1111-1111-111111111111",
    receivedAt: new Date("2026-06-06T12:00:00.000Z"),
    lastSeenAt: null,
    method: HttpMethod.create("POST") as HttpMethod,
    path: "/v2/ventas",
    firebaseUid: "fb-uid-test",
    usuarioId: "22222222-2222-2222-2222-222222222222",
    idempotencyKey: "idem-test",
    requestId: "33333333-3333-3333-3333-333333333333",
    body: { cliente: "test" },
    bodyTruncated: false,
    hasBlob: false,
    bodyContentType: null,
    httpStatus: 422,
    errorCode: "validation_error",
    errorMessage: "campo inválido",
    retryCount: 0,
    status: IntentStatus.create("new") as IntentStatus,
    resolvedAt: null,
    resolvedBy: null,
    notes: null,
    modulo: null,
    resumen: null,
  };
  return { ...base, ...overrides };
}

// resumenDe completa los campos que una prueba no nombra. Sin él, cada literal
// de resumen en las pruebas tiene que repetir `monto: null, referencia: null,
// cliente: null`, y añadir un campo al tipo obliga a tocarlos todos.
export function resumenDe(
  partial: Partial<import("../../domain/entities/ResumenIntento").ResumenIntento>,
): import("../../domain/entities/ResumenIntento").ResumenIntento {
  return {
    titulo: partial.titulo ?? null,
    monto: partial.monto ?? null,
    referencia: partial.referencia ?? null,
    cliente: partial.cliente ?? null,
  };
}
