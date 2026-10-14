import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";

const permisos = { modulos: [] as string[] };

vi.mock("../useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    canAccessModule: (k: string) => k === "HOME" || permisos.modulos.includes(k),
    getAvailableModules: () => ["HOME", ...permisos.modulos],
  }),
}));

describe("usePermissions con Desempeño de cobradores (D9)", () => {
  it("aterrizaje tras login: con Desempeño encendido va al tablero ('/')", () => {
    permisos.modulos = ["CLIENTES", "DESEMPENO_COBRADORES"];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getFirstAvailableRoute()).toBe("/");
  });

  it("aterrizaje tras login: sin Desempeño, la primera pantalla como hoy", () => {
    permisos.modulos = ["CLIENTES", "RUTAS"];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.getFirstAvailableRoute()).toBe("/clientes");
  });

  it("'/' no es ruta protegida: Inicio la pinta para todos", () => {
    permisos.modulos = [];
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isProtectedRoute("/")).toBe(false);
    expect(result.current.canAccessRoute("/")).toBe(true);
  });
});
