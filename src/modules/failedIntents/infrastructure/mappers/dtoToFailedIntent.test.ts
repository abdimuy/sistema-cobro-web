import { describe, expect, it } from "vitest";
import { dtoToFailedIntent } from "./dtoToFailedIntent";
import {
  jsonIntentDTO,
  blobIntentDTO,
  resolvedIntentDTO,
} from "../../../../test/msw/fixtures/failedIntents";
import { DomainError } from "../../domain/errors";

describe("dtoToFailedIntent", () => {
  it("maps a minimal new JSON intent", () => {
    const e = dtoToFailedIntent(jsonIntentDTO);
    expect(e.id).toBe(jsonIntentDTO.id);
    expect(e.method.value).toBe("POST");
    expect(e.path).toBe("/v2/ventas");
    expect(e.hasBlob).toBe(false);
    expect(e.bodyContentType).toBeNull();
    expect(e.body).toEqual({ cliente: "Carlos Méndez", venta_id: "v-1" });
    expect(e.status.value).toBe("new");
    expect(e.resolvedAt).toBeNull();
    expect(e.resolvedBy).toBeNull();
    expect(e.notes).toBeNull();
  });

  it("maps a blob intent — body=null, hasBlob=true, content-type surfaced", () => {
    const e = dtoToFailedIntent(blobIntentDTO);
    expect(e.hasBlob).toBe(true);
    expect(e.body).toBeNull();
    expect(e.bodyContentType).toBe(
      "multipart/form-data; boundary=----WebKitFormBoundary",
    );
    expect(e.errorCode).toBe("idempotency_key_mismatch");
  });

  it("parses received_at into a Date", () => {
    const e = dtoToFailedIntent(jsonIntentDTO);
    expect(e.receivedAt).toBeInstanceOf(Date);
    expect(e.receivedAt.toISOString().startsWith("2026-06-06T12:34:56")).toBe(true);
  });

  it("maps a resolved intent with notes + resolver fields", () => {
    const e = dtoToFailedIntent(resolvedIntentDTO);
    expect(e.status.value).toBe("ignored");
    expect(e.resolvedAt).toBeInstanceOf(Date);
    expect(e.resolvedBy).toBe("77777777-7777-7777-7777-777777777777");
    expect(e.notes).toBe("duplicado");
  });

  it("throws DomainError on invalid status", () => {
    expect(() =>
      dtoToFailedIntent({ ...jsonIntentDTO, status: "unknown_status" }),
    ).toThrowError(DomainError);
  });

  it("throws DomainError on invalid method", () => {
    expect(() =>
      dtoToFailedIntent({ ...jsonIntentDTO, method: "CONNECT" }),
    ).toThrowError(DomainError);
  });

  it("throws DomainError on invalid received_at", () => {
    expect(() =>
      dtoToFailedIntent({ ...jsonIntentDTO, received_at: "not-a-date" }),
    ).toThrowError(DomainError);
  });
});
