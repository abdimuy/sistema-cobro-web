import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { UsuariosTab } from "../usuarios/UsuariosTab";
import { UsuariosRolesProvider } from "../../presentation/context/UsuariosRolesContext";
import { FakeUsuariosRolesPort, makeFakeRol, makeFakeUsuario } from "../../application/__tests__/fakeUsuariosRolesPort";

function renderTab(port: FakeUsuariosRolesPort) {
  return render(
    <UsuariosRolesProvider port={port}>
      <UsuariosTab />
    </UsuariosRolesProvider>,
  );
}

describe("UsuariosTab", () => {
  it("renders usuarios with role badges fetched per row and filters by search", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const brenda = makeFakeUsuario({
      id: "usr-brenda",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
      email: "brenda.sanchez@muebleriamsp.mx",
    });
    const carlos = makeFakeUsuario({
      id: "usr-carlos",
      nombre: "CARLOS RAMOS LUNA",
      email: "carlos.ramos@muebleriamsp.mx",
    });
    port.listarUsuariosResponse = [brenda, carlos];
    port.rolesDeUsuarioResponse = [makeFakeRol({ id: "rol-supervisor", nombre: "supervisor" })];

    renderTab(port);

    await waitFor(() => expect(screen.getByText("BRENDA GUADALUPE SÁNCHEZ RUIZ")).toBeInTheDocument());
    expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument();

    // Roles are fetched in parallel, one call per usuario row.
    await waitFor(() =>
      expect(port.rolesDeUsuarioCalls.map((c) => c.usuarioId).sort()).toEqual(["usr-brenda", "usr-carlos"]),
    );
    await waitFor(() => expect(screen.getAllByText("supervisor")).toHaveLength(2));

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "brenda");

    expect(screen.getByText("BRENDA GUADALUPE SÁNCHEZ RUIZ")).toBeInTheDocument();
    expect(screen.queryByText("CARLOS RAMOS LUNA")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no usuarios", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarUsuariosResponse = [];

    renderTab(port);

    await waitFor(() => expect(screen.getByText("Sin usuarios")).toBeInTheDocument());
  });

  it("surfaces a load error", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.listarUsuarios = new Error("network_error");

    renderTab(port);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
