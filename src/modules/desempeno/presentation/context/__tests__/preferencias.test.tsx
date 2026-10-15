import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { DesempenoProvider } from "../DesempenoProvider";
import { usePreferencias } from "../usePreferencias";
import { useDesempenoPort } from "../useDesempenoPort";
import { CLAVE_PAUSA_MIN, CLAVE_VISTA_LINEA } from "../../preferencias";
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

  it("el umbral de pausa se recuerda por computadora y acepta cualquier entero 5–240", () => {
    localStorage.setItem(CLAVE_PAUSA_MIN, JSON.stringify(37));
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    expect(result.current.pausaMin).toBe(37);
    expect(result.current.consultaJornada.pausaMin).toBe(37);
    expect(result.current.consultaTablero.pausaMin).toBe(37);

    act(() => result.current.setPausaMin(125));

    expect(result.current.pausaMin).toBe(125);
    expect(localStorage.getItem(CLAVE_PAUSA_MIN)).toBe(JSON.stringify(125));
  });

  it.each([
    ["menor a 5", 4],
    ["mayor a 240", 241],
    ["con decimales", 12.5],
    ["texto", "30"],
    ["nulo", null],
  ])("un umbral guardado inválido (%s) cae a 45", (_caso, guardado) => {
    localStorage.setItem(CLAVE_PAUSA_MIN, JSON.stringify(guardado));
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    expect(result.current.pausaMin).toBe(45);
  });

  it("un umbral guardado que no es JSON cae a 45", () => {
    localStorage.setItem(CLAVE_PAUSA_MIN, "{roto");
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    expect(result.current.pausaMin).toBe(45);
  });

  it("setPausaMin ignora un valor fuera del contrato: ni lo usa ni lo guarda", () => {
    const { result } = renderHook(() => usePreferencias(), { wrapper: envoltura });
    act(() => result.current.setPausaMin(500));
    act(() => result.current.setPausaMin(2));
    expect(result.current.pausaMin).toBe(45);
    expect(localStorage.getItem(CLAVE_PAUSA_MIN)).toBeNull();
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
