import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { FailedIntentsProvider } from "../context/FailedIntentsContext";
import { useResolverAction } from "./useResolverAction";
import {
  FakeRepoPort,
  makeFakeIntent,
} from "../../application/__tests__/fakeRepoPort";
import { IntentStatus } from "../../domain/values";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeRepoPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <FailedIntentsProvider port={port}>{children}</FailedIntentsProvider>
  );
}

describe("useResolverAction", () => {
  it("transitions idle → success with the updated entity", async () => {
    const port = new FakeRepoPort();
    port.resolveResponse = makeFakeIntent({
      status: IntentStatus.create("ignored") as IntentStatus,
      notes: "duplicado",
    });
    const { result } = renderHook(() => useResolverAction(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.resolve({
        intentId: "abc",
        status: "ignored",
        notes: "duplicado",
      });
    });

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    if (result.current.state.status === "success") {
      expect(result.current.state.intent.status.value).toBe("ignored");
    }
  });

  it("surfaces conflict errors from the backend", async () => {
    const port = new FakeRepoPort();
    port.throwOnNext.resolve = new DomainError(
      "failed_intent_status_conflict",
      "conflicto",
    );
    const { result } = renderHook(() => useResolverAction(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.resolve({
        intentId: "abc",
        status: "ignored",
        notes: "",
      });
    });

    await waitFor(() => expect(result.current.state.status).toBe("error"));
    if (result.current.state.status === "error") {
      expect(result.current.state.error.code).toBe(
        "failed_intent_status_conflict",
      );
    }
  });

  it("notes over 500 runes are caught by the use-case guard before the port", async () => {
    const port = new FakeRepoPort();
    const { result } = renderHook(() => useResolverAction(), {
      wrapper: wrapWith(port),
    });
    await act(async () => {
      await result.current.resolve({
        intentId: "abc",
        status: "ignored",
        notes: "a".repeat(501),
      });
    });
    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      expect(result.current.state.error.code).toBe("notes_too_long");
    }
    expect(port.resolveCalls).toHaveLength(0);
  });
});
