import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { FailedIntentsProvider } from "../context/FailedIntentsContext";
import { useFailedIntentsList } from "./useFailedIntentsList";
import {
  FakeRepoPort,
  makeFakeIntent,
} from "../../application/__tests__/fakeRepoPort";
import { IntentStatus, ReplayOutcome as _ReplayOutcome } from "../../domain/values";

function wrapWith(port: FakeRepoPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <FailedIntentsProvider port={port}>{children}</FailedIntentsProvider>
  );
}

describe("useFailedIntentsList", () => {
  it("fetches the first page on mount and exposes items + nextCursor + hasMore", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [makeFakeIntent({ id: "a" })],
      nextCursor: "cur-1",
      hasMore: true,
    };
    const { result } = renderHook(() => useFailedIntentsList({ status: "new" }), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.nextCursor).toBe("cur-1");
    expect(result.current.hasMore).toBe(true);
    expect(port.listCalls[0].input).toMatchObject({
      status: "new",
      pageSize: 20,
    });
  });

  it("loadNext appends the next page using the cursor", async () => {
    const port = new FakeRepoPort();
    let call = 0;
    port.listResponse = () => {
      call++;
      if (call === 1) {
        return {
          items: [makeFakeIntent({ id: "a" })],
          nextCursor: "cur-1",
          hasMore: true,
        };
      }
      return {
        items: [makeFakeIntent({ id: "b" })],
        nextCursor: null,
        hasMore: false,
      };
    };
    const { result } = renderHook(() => useFailedIntentsList(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.loadNext());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(result.current.hasMore).toBe(false);
    expect(port.listCalls[1].input.cursor).toBe("cur-1");
  });

  it("loadNext is a no-op when hasMore is false or no cursor", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [makeFakeIntent({ id: "a" })],
      nextCursor: null,
      hasMore: false,
    };
    const { result } = renderHook(() => useFailedIntentsList(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.loadNext());
    expect(port.listCalls).toHaveLength(1);
  });

  it("changing status resets and refetches", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [makeFakeIntent({ id: "a" })],
      nextCursor: null,
      hasMore: false,
    };
    const { result, rerender } = renderHook(
      (props: { status?: IntentStatus["value"] }) =>
        useFailedIntentsList({ status: props.status }),
      { wrapper: wrapWith(port), initialProps: { status: "new" } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ status: "ignored" });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(port.listCalls.map((c) => c.input.status)).toEqual([
      "new",
      "ignored",
    ]);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeRepoPort();
    port.throwOnNext.list = Object.assign(new Error("kaboom"), {
      code: "network_error",
    });
    const { result } = renderHook(() => useFailedIntentsList(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it("refresh re-fetches with the same filters", async () => {
    const port = new FakeRepoPort();
    const { result } = renderHook(() => useFailedIntentsList(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.refresh());
    await waitFor(() => expect(port.listCalls.length).toBeGreaterThanOrEqual(2));
  });
});
