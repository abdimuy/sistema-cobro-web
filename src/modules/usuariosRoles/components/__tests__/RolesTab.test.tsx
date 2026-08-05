import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { RolesTab } from "../roles/RolesTab";
import { UsuariosRolesProvider } from "../../presentation/context/UsuariosRolesContext";
import { FakeUsuariosRolesPort, makeFakePermiso, makeFakeRol } from "../../application/__tests__/fakeUsuariosRolesPort";

function renderTab(port: FakeUsuariosRolesPort) {
  return render(
    <UsuariosRolesProvider port={port}>
      <RolesTab />
    </UsuariosRolesProvider>,
  );
}

describe("RolesTab", () => {
  it("crear rol calls crearRol with nombre y description", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    port.listarRolesResponse = [];
    port.crearRolResponse = makeFakeRol({ id: "rol-cajero", nombre: "cajero" });

    renderTab(port);
    await waitFor(() => expect(screen.getByText("Sin roles")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Nuevo rol/ }));
    await user.type(screen.getByLabelText("Nombre"), "cajero");
    await user.type(screen.getByLabelText("Descripción"), "cobra en caja");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => expect(port.crearRolCalls).toHaveLength(1));
    expect(port.crearRolCalls[0].input).toEqual({ nombre: "cajero", description: "cobra en caja" });
    // The dialog closes after a successful crear.
    await waitFor(() => expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument());
  });

  it("renombrar un rol mutable llama actualizarRol", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const supervisor = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor", description: "desc" });
    port.listarRolesResponse = [supervisor];
    port.permisosDeRolResponse = [];
    port.listarCatalogoPermisosResponse = [];
    port.actualizarRolResponse = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor senior" });

    renderTab(port);
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Ver rol supervisor" }));

    const nombreInput = await screen.findByLabelText("Nombre");
    await user.clear(nombreInput);
    await user.type(nombreInput, "supervisor senior");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(port.actualizarRolCalls).toHaveLength(1));
    expect(port.actualizarRolCalls[0]).toMatchObject({
      rolId: "rol-supervisor",
      input: { nombre: "supervisor senior" },
    });
  });

  it("borrar un rol mutable (confirmado) llama eliminarRol", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const supervisor = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor" });
    port.listarRolesResponse = [supervisor];
    port.permisosDeRolResponse = [];
    port.listarCatalogoPermisosResponse = [];

    renderTab(port);
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Ver rol supervisor" }));

    await user.click(await screen.findByRole("button", { name: "Eliminar rol" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(port.eliminarRolCalls).toEqual([{ rolId: "rol-supervisor", signal: undefined }]),
    );
  });

  it("rol inmutable: renombrar y borrar están deshabilitados con razón visible", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const superAdmin = makeFakeRol({ id: "rol-super-admin", nombre: "super_admin", inmutable: true });
    port.listarRolesResponse = [superAdmin];
    port.permisosDeRolResponse = [];
    port.listarCatalogoPermisosResponse = [makeFakePermiso()];

    renderTab(port);
    await waitFor(() => expect(screen.getByText("super_admin")).toBeInTheDocument());
    expect(screen.getByText("Rol del sistema")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver rol super_admin" }));

    expect(await screen.findByLabelText("Nombre")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar rol" })).toBeDisabled();
    expect(screen.getByText("Rol del sistema, no editable")).toBeInTheDocument();
  });

  it("filtra por búsqueda sobre el nombre del rol", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    port.listarRolesResponse = [
      makeFakeRol({ id: "rol-supervisor", nombre: "supervisor" }),
      makeFakeRol({ id: "rol-cajero", nombre: "cajero" }),
    ];

    renderTab(port);
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "cajero");

    expect(screen.getByText("cajero")).toBeInTheDocument();
    expect(screen.queryByText("supervisor")).not.toBeInTheDocument();
  });
});
