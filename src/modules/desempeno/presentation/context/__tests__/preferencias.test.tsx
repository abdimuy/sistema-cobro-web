import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { DesempenoProvider } from "../DesempenoProvider";
import { usePreferencias } from "../usePreferencias";
import { useDesempenoPort } from "../useDesempenoPort";
import { CLAVE_VISTA_LINEA } from "../../preferencias";
import { FakeDesempenoPort } from "../../../application/__tests__/fakeDesempenoPort";

const port = new FakeDesempenoPort();
function envoltura({ children }: { children: ReactNode }) {
  return <DesempenoProvider port={port}>{children}</DesempenoProvider>;
}

describe("preferencias de la pantalla", () => {
  beforeEach(() => localStorage.clear());

  it("abre en Hoy, pausa de 45 min, sin horario y vista Bloques (D8, D16)", () => {
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    expect(result.current.periodo).toBe("hoy");
    expect(result.current.pausaMin).toBe(45);
    expect(result.current.horario).toBeNull();
    expect(result.current.vista).toBe("bloques");
  });

  it("la vista se recuerda por computadora", () => {
    localStorage.setItem(CLAVE_VISTA_LINEA, JSON.stringify("por_hora"));
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    expect(result.current.vista).toBe("por_hora");

    act(() => result.current.setVista("puntos"));

    expect(localStorage.getItem(CLAVE_VISTA_LINEA)).toBe(JSON.stringify("puntos"));
  });

  it("una vista guardada que ya no existe vuelve a Bloques", () => {
    localStorage.setItem(CLAVE_VISTA_LINEA, JSON.stringify("barras"));
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    expect(result.current.vista).toBe("bloques");
  });

  it("consultaTablero es estable entre renders y cambia con el periodo", () => {
    const { result, rerender } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    const antes = result.current.consultaTablero;
    rerender();
    expect(result.current.consultaTablero).toBe(antes);

    act(() => result.current.setPeriodo("semana"));

    expect(result.current.consultaTablero).toEqual({ periodo: "semana", pausaMin: 45, horario: null });
  });

  it("useDesempenoPort entrega el puerto del provider", () => {
    const { result } = renderHook(() => useDesempenoPort(), { wrapper: envoltura });
    expect(result.current).toBe(port);
  });
});
