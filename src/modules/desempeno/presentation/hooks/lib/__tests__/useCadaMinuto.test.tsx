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

  describe("con la ventana oculta", () => {
    let oculto = false;
    beforeEach(() => {
      oculto = false;
      vi.spyOn(document, "hidden", "get").mockImplementation(() => oculto);
    });
    afterEach(() => vi.restoreAllMocks());
    const cambiarVisibilidad = (o: boolean) => {
      oculto = o;
      document.dispatchEvent(new Event("visibilitychange"));
    };

    it("pausa mientras document.hidden y refresca una vez al volver a ser visible", () => {
      const fn = vi.fn();
      renderHook(() => useCadaMinuto(fn, true));
      cambiarVisibilidad(true);
      vi.advanceTimersByTime(5 * UN_MINUTO_MS);
      expect(fn).not.toHaveBeenCalled();
      cambiarVisibilidad(false);
      expect(fn).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(UN_MINUTO_MS);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("si arranca oculta no llama hasta volver a ser visible", () => {
      oculto = true;
      const fn = vi.fn();
      renderHook(() => useCadaMinuto(fn, true));
      vi.advanceTimersByTime(3 * UN_MINUTO_MS);
      expect(fn).not.toHaveBeenCalled();
      cambiarVisibilidad(false);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("inactivo no refresca al volver a ser visible", () => {
      const fn = vi.fn();
      renderHook(() => useCadaMinuto(fn, false));
      cambiarVisibilidad(true);
      cambiarVisibilidad(false);
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
