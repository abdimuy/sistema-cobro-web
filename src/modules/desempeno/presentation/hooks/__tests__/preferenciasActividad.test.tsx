import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVistasGuardadas } from "../useVistasGuardadas";
import { useColumnasActividad } from "../useColumnasActividad";
import { CLAVE_COLUMNAS, CLAVE_VISTAS, COLUMNAS_POR_DEFECTO } from "../../actividadPreferencias";
import { FILTROS_ACTIVIDAD_INICIALES } from "../../../domain/entities";

describe("vistas guardadas y columnas (por computadora)", () => {
  beforeEach(() => localStorage.clear());

  it("guarda una vista y la recupera en otra sesión", () => {
    const filtros = { ...FILTROS_ACTIVIDAD_INICIALES, conGps: false };
    const primera = renderHook(() => useVistasGuardadas());
    act(() => {
      primera.result.current.guardar("Sin GPS de la tarde", filtros, ["tipo", "hora"]);
    });
    expect(JSON.parse(localStorage.getItem(CLAVE_VISTAS)!)).toHaveLength(1);

    const segunda = renderHook(() => useVistasGuardadas());
    expect(segunda.result.current.vistas[0].nombre).toBe("Sin GPS de la tarde");
    expect(segunda.result.current.vistas[0].filtros.conGps).toBe(false);

    act(() => segunda.result.current.eliminar(segunda.result.current.vistas[0].id));
    expect(segunda.result.current.vistas).toHaveLength(0);
  });

  it("basura en localStorage no tumba la pestaña", () => {
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([{ id: 3 }]));
    localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(["tipo", "inventada"]));
    expect(renderHook(() => useVistasGuardadas()).result.current.vistas).toEqual([]);
    expect(renderHook(() => useColumnasActividad()).result.current.columnas).toEqual(
      COLUMNAS_POR_DEFECTO,
    );
  });

  it("una vista con filtros de otra forma (versión vieja o editada a mano) se descarta", () => {
    const buena = {
      id: "mi-1",
      nombre: "Buena",
      filtros: { ...FILTROS_ACTIVIDAD_INICIALES, conGps: false },
      columnas: ["tipo"],
    };
    const malas = [
      { ...buena, id: "m1", filtros: { ...FILTROS_ACTIVIDAD_INICIALES, tipos: "pago" } },
      { ...buena, id: "m2", filtros: { ...FILTROS_ACTIVIDAD_INICIALES, orden: "colonia" } },
      { ...buena, id: "m3", filtros: { ...FILTROS_ACTIVIDAD_INICIALES, formasCobro: ["deposito"] } },
      { ...buena, id: "m4", filtros: { ...FILTROS_ACTIVIDAD_INICIALES, conGps: "no" } },
      { ...buena, id: "m5", filtros: { tipos: [] } },
    ];
    for (const mala of malas) {
      localStorage.setItem(CLAVE_VISTAS, JSON.stringify([buena, mala]));
      expect(renderHook(() => useVistasGuardadas()).result.current.vistas).toEqual([]);
    }
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([buena]));
    expect(renderHook(() => useVistasGuardadas()).result.current.vistas).toHaveLength(1);
  });

  it("localStorage que lanza no tumba la pestaña", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("bloqueado");
    };
    try {
      expect(renderHook(() => useVistasGuardadas()).result.current.vistas).toEqual([]);
      expect(renderHook(() => useColumnasActividad()).result.current.columnas).toEqual(
        COLUMNAS_POR_DEFECTO,
      );
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it("alterna columnas, las recuerda y nunca deja la tabla sin columnas", () => {
    const { result } = renderHook(() => useColumnasActividad());
    act(() => result.current.alternar("forma"));
    expect(result.current.columnas).toContain("forma");
    expect(JSON.parse(localStorage.getItem(CLAVE_COLUMNAS)!)).toContain("forma");

    act(() => result.current.fijar(["tipo"]));
    act(() => result.current.alternar("tipo"));
    expect(result.current.columnas).toEqual(["tipo"]);
  });
});
