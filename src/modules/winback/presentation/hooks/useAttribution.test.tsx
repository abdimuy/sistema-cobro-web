import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { WinbackProvider } from "../context/WinbackContext";
import { useAttribution } from "./useAttribution";
import {
  FakeWinbackPort,
  makeFakeAttribution,
} from "../../application/__tests__/fakeWinbackPort";

function wrapWith(port: FakeWinbackPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <WinbackProvider port={port}>{children}</WinbackProvider>
  );
}

describe("useAttribution", () => {
  it("fetches on mount and exposes attribution data", async () => {
    const port = new FakeWinbackPort();
    port.attributionResponse = makeFakeAttribution({ uplift: "0.25" });
    const { result } = renderHook(() => useAttribution(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.attribution).not.toBeNull();
    expect(result.current.attribution?.uplift).toBe("0.25");
    expect(result.current.error).toBeNull();
    expect(port.attributionCalls).toHaveLength(1);
  });

  it("re-fetches when zona changes", async () => {
    const port = new FakeWinbackPort();
    port.attributionResponse = makeFakeAttribution();

    const { rerender } = renderHook(
      (props: { zona?: string }) => useAttribution({ zona: props.zona }),
      { wrapper: wrapWith(port), initialProps: {} },
    );
    await waitFor(() => expect(port.attributionCalls).toHaveLength(1));

    rerender({ zona: "NORTE" });
    await waitFor(() => expect(port.attributionCalls).toHaveLength(2));
    expect(port.attributionCalls[1].input.zona).toBe("NORTE");
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeWinbackPort();
    port.throwOnNext.obtenerAttribution = new Error("request failed");
    const { result } = renderHook(() => useAttribution(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.attribution).toBeNull();
  });

  it("refresh re-fetches with the same zona", async () => {
    const port = new FakeWinbackPort();
    port.attributionResponse = makeFakeAttribution();
    const { result } = renderHook(() => useAttribution({ zona: "SUR" }), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.attributionCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.attributionCalls[1].input.zona).toBe("SUR");
  });
});
