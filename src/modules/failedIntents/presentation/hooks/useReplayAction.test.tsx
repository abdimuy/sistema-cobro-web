import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { FailedIntentsProvider } from "../context/FailedIntentsContext";
import { useReplayAction } from "./useReplayAction";
import {
  FakeRepoPort,
  makeFakeIntent,
} from "../../application/__tests__/fakeRepoPort";
import { ReplayOutcome } from "../../domain/values";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeRepoPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <FailedIntentsProvider port={port}>{children}</FailedIntentsProvider>
  );
}

describe("useReplayAction", () => {
  it("transitions idle → pending → success", async () => {
    const port = new FakeRepoPort();
    port.replayResponse = {
      outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
      replayHttpStatus: 201,
      replayBodyPreview: '{"ok":true}',
    };
    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(port),
    });
    expect(result.current.state.status).toBe("idle");

    await act(async () => {
      await result.current.replay("abc");
    });

    await waitFor(() =>
      expect(result.current.state.status).toBe("success"),
    );
    if (result.current.state.status === "success") {
      expect(result.current.state.result.replayHttpStatus).toBe(201);
    }
  });

  it("transitions idle → pending → error on DomainError", async () => {
    const port = new FakeRepoPort();
    port.throwOnNext.replay = new DomainError(
      "intent_has_no_usuario",
      "vendedor faltante",
    );
    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.replay("abc");
    });

    await waitFor(() => expect(result.current.state.status).toBe("error"));
    if (result.current.state.status === "error") {
      expect(result.current.state.error.code).toBe("intent_has_no_usuario");
    }
  });

  it("drops second trigger while pending", async () => {
    const port = new FakeRepoPort();
    // Make the first call hang by overriding response with a never-resolving thunk.
    let resolveFirst: (v: typeof port.replayResponse) => void = () => {};
    port.replayResponse = () =>
      ({
        // Use a placeholder; the real promise lives in the port's `replay()`.
        outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
        replayHttpStatus: 200,
        replayBodyPreview: "",
      });
    // Override the port directly to control timing.
    const slowPort = new FakeRepoPort();
    slowPort.replay = (intentId: string) => {
      slowPort.replayCalls.push({ intentId });
      return new Promise((res) => {
        resolveFirst = (v) => res(v as never);
      });
    };

    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(slowPort),
    });

    let r2: unknown = "not-yet";
    await act(async () => {
      void result.current.replay("abc");
      // Second call while the first is in flight — must return null.
      r2 = await result.current.replay("abc");
    });
    expect(r2).toBeNull();
    expect(slowPort.replayCalls).toHaveLength(1);

    await act(async () => {
      resolveFirst({
        outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
        replayHttpStatus: 201,
        replayBodyPreview: "",
      });
    });
  });

  it("replayWith refuses blob intents via the use case guard", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });

    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.replayWith(intent, {});
    });

    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      expect(result.current.state.error.code).toBe(
        "blob_intent_replay_with_unsupported",
      );
    }
    expect(port.replayWithCalls).toHaveLength(0);
  });

  it("replayWithMultipart succeeds for a blob intent + valid manifest", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(port),
    });

    const manifest = [
      {
        name: "venta_json",
        source: { kind: "field", value: new TextEncoder().encode("{}") },
      },
    ] as const;

    await act(async () => {
      await result.current.replayWithMultipart(
        intent,
        manifest,
        new Map(),
      );
    });

    expect(result.current.state.status).toBe("success");
    expect(port.replayWithMultipartCalls).toHaveLength(1);
  });

  it("replayWithMultipart rejects when intent is JSON (use-case guard)", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: false });
    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(port),
    });
    const manifest = [
      {
        name: "x",
        source: { kind: "field", value: new Uint8Array() },
      },
    ] as const;
    await act(async () => {
      await result.current.replayWithMultipart(intent, manifest, new Map());
    });
    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      expect(result.current.state.error.code).toBe("intent_not_multipart");
    }
    expect(port.replayWithMultipartCalls).toHaveLength(0);
  });

  it("reset returns the hook to idle", async () => {
    const port = new FakeRepoPort();
    const { result } = renderHook(() => useReplayAction(), {
      wrapper: wrapWith(port),
    });
    await act(async () => {
      await result.current.replay("abc");
    });
    act(() => result.current.reset());
    expect(result.current.state.status).toBe("idle");
  });
});
