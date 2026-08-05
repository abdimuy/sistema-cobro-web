import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RolPanel } from "../roles/RolPanel";
import { UsuariosRolesProvider } from "../../presentation/context/UsuariosRolesContext";
import { FakeUsuariosRolesPort, makeFakePermiso, makeFakeRol } from "../../application/__tests__/fakeUsuariosRolesPort";

// RolPanel uses SheetTitle/SheetDescription, which are Radix Dialog
// primitives under the hood and require a Sheet (Dialog.Root) ancestor —
// mirror how RolesTab actually mounts it.
function renderPanel(port: FakeUsuariosRolesPort, rol = makeFakeRol(), onCambio = vi.fn(), onEliminado = vi.fn()) {
  return render(
    <UsuariosRolesProvider port={port}>
      <Sheet open>
        <SheetContent>
          <RolPanel rol={rol} onCambio={onCambio} onEliminado={onEliminado} />
        </SheetContent>
      </Sheet>
    </UsuariosRolesProvider>,
  );
}

describe("RolPanel", () => {
  it("toggling an unassigned permiso checkbox calls asignarPermisoARol", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const rol = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor", inmutable: false });
    port.listarCatalogoPermisosResponse = [makeFakePermiso({ codigo: "usuarios:ver", categoria: "usuarios" })];
    port.permisosDeRolResponse = [];

    renderPanel(port, rol);

    const checkbox = await screen.findByRole("checkbox", { name: "usuarios:ver" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    await waitFor(() =>
      expect(port.asignarPermisoARolCalls).toEqual([{ rolId: "rol-supervisor", codigo: "usuarios:ver", signal: undefined }]),
    );
  });

  it("toggling an assigned permiso checkbox off calls quitarPermisoDeRol", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const rol = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor", inmutable: false });
    const permiso = makeFakePermiso({ codigo: "usuarios:ver", categoria: "usuarios" });
    port.listarCatalogoPermisosResponse = [permiso];
    port.permisosDeRolResponse = [permiso];

    renderPanel(port, rol);

    const checkbox = await screen.findByRole("checkbox", { name: "usuarios:ver" });
    await waitFor(() => expect(checkbox).toBeChecked());

    await user.click(checkbox);

    await waitFor(() =>
      expect(port.quitarPermisoDeRolCalls).toEqual([{ rolId: "rol-supervisor", codigo: "usuarios:ver", signal: undefined }]),
    );
  });

  it("rol inmutable: el checklist queda de solo lectura", async () => {
    const port = new FakeUsuariosRolesPort();
    const rol = makeFakeRol({ id: "rol-super-admin", nombre: "super_admin", inmutable: true });
    const permiso = makeFakePermiso({ codigo: "usuarios:ver", categoria: "usuarios" });
    port.listarCatalogoPermisosResponse = [permiso];
    port.permisosDeRolResponse = [permiso];

    renderPanel(port, rol);

    const checkbox = await screen.findByRole("checkbox", { name: "usuarios:ver" });
    expect(checkbox).toBeDisabled();
  });
});
