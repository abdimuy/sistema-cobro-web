import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { DESKTOP_MODULES } from "@/constants/modules";
import { useEtiquetaModuloActual } from "../useEtiquetaModuloActual";

const permisos = { modulos: [] as string[] };

vi.mock("../usePermissions", () => ({
  usePermissions: () => ({
    getAvailableModulesWithConfig: () =>
      DESKTOP_MODULES.filter((m) => m.key === "HOME" || permisos.modulos.includes(m.key)),
  }),
}));

function etiqueta(ruta: string, modulos: string[]) {
  permisos.modulos = modulos;
  const envoltura = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>
  );
  return renderHook(() => useEtiquetaModuloActual(), { wrapper: envoltura }).result.current;
}

describe("useEtiquetaModuloActual (cabecera de AppLayout)", () => {
  it("en '/' con Desempeño dice Desempeño de cobradores (también con ?usuario=)", () => {
    expect(etiqueta("/", ["DESEMPENO_COBRADORES"])).toBe("Desempeño de cobradores");
    expect(etiqueta("/?usuario=uid-juan", ["DESEMPENO_COBRADORES"])).toBe("Desempeño de cobradores");
  });

  it("en '/' sin Desempeño dice Inicio", () => {
    expect(etiqueta("/", ["CLIENTES"])).toBe("Inicio");
  });

  it("las demás pantallas siguen igual, también subrutas", () => {
    expect(etiqueta("/clientes/123", ["CLIENTES", "DESEMPENO_COBRADORES"])).toBe("Clientes");
    expect(etiqueta("/rutas", [])).toBe("Rutas");
  });
});
