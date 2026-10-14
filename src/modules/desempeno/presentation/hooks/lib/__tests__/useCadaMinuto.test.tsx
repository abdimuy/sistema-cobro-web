import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { UN_MINUTO_MS, useCadaMinuto } from "../useCadaMinuto";

describe("useCadaMinuto", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("llama cada 60 s mientras está activo", () => {
    const fn = vi.fn();
    renderHook(() => useCadaMinuto(fn, true));
    vi.advanceTimersByTime(UN_MINUTO_MS - 1);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(UN_MINUTO_MS);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("inactivo no llama, y al desmontar se detiene", () => {
    const inactivo = vi.fn();
    renderHook(() => useCadaMinuto(inactivo, false));
    vi.advanceTimersByTime(3 * UN_MINUTO_MS);
    expect(inactivo).not.toHaveBeenCalled();

    const activo = vi.fn();
    const { unmount } = renderHook(() => useCadaMinuto(activo, true));
    unmount();
    vi.advanceTimersByTime(3 * UN_MINUTO_MS);
    expect(activo).not.toHaveBeenCalled();
  });
});
