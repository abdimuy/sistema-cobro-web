import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tema = "light";
vi.mock("@/context/ThemeContext", () => ({ useTheme: () => ({ theme: tema }) }));

import { ESTILOS_CLAROS, ESTILOS_OSCUROS, useEstilosDeMapa } from "../estilosDeMapa";

type Oyente = () => void;
let sistemaOscuro = false;
let oyentes: Oyente[] = [];

function oculta(estilos: google.maps.MapTypeStyle[], tipo: string) {
  return estilos.some(
    (e) => e.featureType === tipo && e.stylers?.some((s) => (s as { visibility?: string }).visibility === "off"),
  );
}

describe("useEstilosDeMapa", () => {
  beforeEach(() => {
    sistemaOscuro = false;
    oyentes = [];
    window.matchMedia = vi.fn().mockImplementation(() => ({
      get matches() {
        return sistemaOscuro;
      },
      addEventListener: (_: string, fn: Oyente) => oyentes.push(fn),
      removeEventListener: (_: string, fn: Oyente) => {
        oyentes = oyentes.filter((o) => o !== fn);
      },
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    tema = "light";
  });

  it("en light da estilos claros y oculta poi y transit", () => {
    tema = "light";
    const { result } = renderHook(() => useEstilosDeMapa());
    expect(result.current).toBe(ESTILOS_CLAROS);
    for (const t of ["poi", "poi.business", "transit"]) expect(oculta(result.current, t)).toBe(true);
  });

  it("en dark da estilos oscuros, con poi y transit ocultos y calles y agua visibles", () => {
    tema = "dark";
    const { result } = renderHook(() => useEstilosDeMapa());
    expect(result.current).toBe(ESTILOS_OSCUROS);
    expect(result.current.some((e) => e.featureType === "water")).toBe(true);
    expect(result.current.some((e) => e.featureType === "road")).toBe(true);
    for (const t of ["poi", "poi.business", "transit"]) expect(oculta(result.current, t)).toBe(true);
    expect(oculta(result.current, "road")).toBe(false);
    expect(oculta(result.current, "administrative.locality")).toBe(false);
  });

  it("con tema system sigue prefers-color-scheme y reacciona al cambio", () => {
    tema = "system";
    const { result } = renderHook(() => useEstilosDeMapa());
    expect(result.current).toBe(ESTILOS_CLAROS);
    act(() => {
      sistemaOscuro = true;
      oyentes.forEach((o) => o());
    });
    expect(result.current).toBe(ESTILOS_OSCUROS);
  });

  it("reacciona al cambio de tema de la app", () => {
    tema = "light";
    const { result, rerender } = renderHook(() => useEstilosDeMapa());
    expect(result.current).toBe(ESTILOS_CLAROS);
    tema = "dark";
    rerender();
    expect(result.current).toBe(ESTILOS_OSCUROS);
  });
});
