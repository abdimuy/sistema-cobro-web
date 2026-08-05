import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ConfiguracionShell lives in the configuracion module (this task may only
// touch that single file), but the gating behavior it now implements is
// specific to the usuariosRoles tab this task adds — so the test lives here.
const isSuperAdminMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isSuperAdmin: isSuperAdminMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ConfiguracionShell } from "@/modules/configuracion/components/ConfiguracionShell";
import { ConfiguracionProvider } from "@/modules/configuracion/presentation/context/ConfiguracionContext";
import { FakeConfiguracionPort } from "@/modules/configuracion/application/__tests__/fakeConfiguracionPort";

function renderShell() {
  return render(
    <ConfiguracionProvider port={new FakeConfiguracionPort()}>
      <ConfiguracionShell />
    </ConfiguracionProvider>,
  );
}

describe("ConfiguracionShell — gating de Usuarios y roles (SUPER_ADMIN)", () => {
  beforeEach(() => {
    isSuperAdminMock.mockReset();
  });

  it("no muestra la pestaña Usuarios y roles cuando isSuperAdmin() es false", () => {
    isSuperAdminMock.mockReturnValue(false);

    renderShell();

    expect(screen.queryByRole("tab", { name: "Usuarios y roles" })).not.toBeInTheDocument();
  });

  it("muestra la pestaña Usuarios y roles cuando isSuperAdmin() es true", () => {
    isSuperAdminMock.mockReturnValue(true);

    renderShell();

    expect(screen.getByRole("tab", { name: "Usuarios y roles" })).toBeInTheDocument();
  });

  it("no toca las pestañas existentes (Vendedores sigue siendo la pestaña por defecto)", () => {
    isSuperAdminMock.mockReturnValue(true);

    renderShell();

    expect(screen.getByRole("tab", { name: "Vendedores", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Zonas y cajas" })).toBeInTheDocument();
  });
});
