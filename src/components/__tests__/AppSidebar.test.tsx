import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DESKTOP_MODULES } from "@/constants/modules";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../AppSidebar";

const permisos = { modulos: [] as string[] };

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    getAvailableModulesWithConfig: () =>
      DESKTOP_MODULES.filter((m) => m.key === "HOME" || permisos.modulos.includes(m.key)),
  }),
}));
vi.mock("@/context/UpdaterContext", () => ({
  useUpdater: () => ({ state: { status: "idle" }, downloadAndInstall: vi.fn(), relaunchApp: vi.fn() }),
}));
vi.mock("../NavUser", () => ({ NavUser: () => null }));

function montar() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("AppSidebar e Inicio (D9)", () => {
  it("con Desempeño, una sola entrada a '/' y se llama Desempeño de cobradores", () => {
    permisos.modulos = ["DESEMPENO_COBRADORES", "CLIENTES"];
    montar();
    expect(screen.getByRole("link", { name: "Desempeño de cobradores" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute("href", "/clientes");
  });

  it("sin Desempeño, Inicio sigue en el menú", () => {
    permisos.modulos = ["CLIENTES"];
    montar();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Desempeño de cobradores" })).not.toBeInTheDocument();
  });
});
