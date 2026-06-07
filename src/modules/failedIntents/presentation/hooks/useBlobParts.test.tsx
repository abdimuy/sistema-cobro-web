import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { FailedIntentsProvider } from "../context/FailedIntentsContext";
import { useBlobParts } from "./useBlobParts";
import { FakeRepoPort } from "../../application/__tests__/fakeRepoPort";
import { BlobPartKind } from "../../domain/values/BlobPartKind";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeRepoPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <FailedIntentsProvider port={port}>{children}</FailedIntentsProvider>
  );
}

describe("useBlobParts", () => {
  it("is inert when intentId is null", async () => {
    const port = new FakeRepoPort();
    const { result } = renderHook(() => useBlobParts(null), {
      wrapper: wrapWith(port),
    });
    expect(result.current.bundle).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(port.getBlobPartsCalls).toHaveLength(0);
  });

  it("fetches the bundle when an intent id is provided", async () => {
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "venta_json",
          kind: BlobPartKind.field(),
          contentType: "application/json",
          filename: null,
          sizeBytes: 4,
          value: new Uint8Array([0x7b, 0x7d, 0x0a, 0x0a]),
        },
      ],
    };
    const { result } = renderHook(() => useBlobParts("abc"), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bundle?.parts).toHaveLength(1);
    expect(port.getBlobPartsCalls).toEqual([{ intentId: "abc" }]);
  });

  it("changing intentId re-fetches", async () => {
    const port = new FakeRepoPort();
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useBlobParts(id),
      { wrapper: wrapWith(port), initialProps: { id: "first" } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ id: "second" });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.getBlobPartsCalls.map((c) => c.intentId)).toEqual([
      "first",
      "second",
    ]);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeRepoPort();
    port.throwOnNext.getBlobParts = new DomainError(
      "failed_intent_no_blob",
      "sin blob",
    );
    const { result } = renderHook(() => useBlobParts("abc"), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.code).toBe("failed_intent_no_blob");
  });

  it("downloadPart delegates to the port for the right (id, index)", async () => {
    const port = new FakeRepoPort();
    const blob = new Blob(["x"], { type: "image/jpeg" });
    port.downloadBlobPartResponse = blob;
    const { result } = renderHook(() => useBlobParts("abc"), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const out = await act(async () => result.current.downloadPart(2));
    expect(out).toBe(blob);
    expect(port.downloadBlobPartCalls).toEqual([{ intentId: "abc", index: 2 }]);
  });
});
