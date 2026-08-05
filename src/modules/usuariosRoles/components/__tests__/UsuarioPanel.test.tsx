import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// The signed-in Firebase uid used across every test in this file. Only the
// anti-lockout test gives a usuario whose firebaseUid matches it.
vi.mock("../../../../../firebase", () => ({
  auth: { currentUser: { uid: "fbuid-brenda" } },
}));

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { UsuarioPanel } from "../usuarios/UsuarioPanel";
import { UsuariosRolesProvider } from "../../presentation/context/UsuariosRolesContext";
import {
  FakeUsuariosRolesPort,
  makeFakePermiso,
  makeFakeRol,
  makeFakeUsuario,
} from "../../application/__tests__/fakeUsuariosRolesPort";

// UsuarioPanel uses SheetTitle/SheetDescription, which are Radix Dialog
// primitives under the hood and require a Sheet (Dialog.Root) ancestor —
// mirror how UsuariosTab actually mounts it.
function renderPanel(port: FakeUsuariosRolesPort, usuario = makeFakeUsuario(), onRolesChanged = vi.fn()) {
  return render(
    <UsuariosRolesProvider port={port}>
      <Sheet open>
        <SheetContent>
          <UsuarioPanel usuario={usuario} onRolesChanged={onRolesChanged} />
        </SheetContent>
      </Sheet>
    </UsuariosRolesProvider>,
  );
}

describe("UsuarioPanel", () => {
  it("toggling a role on calls asignarRolAUsuario and refetches effective permisos", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const usuario = makeFakeUsuario({ id: "usr-1", firebaseUid: "fbuid-otro" });
    const supervisor = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor" });
    port.listarRolesResponse = [supervisor];
    port.rolesDeUsuarioResponse = [];
    port.permisosEfectivosDeUsuarioResponse = [];
    const onRolesChanged = vi.fn();

    renderPanel(port, usuario, onRolesChanged);

    const toggle = await screen.findByRole("switch", { name: "Asignar rol supervisor" });
    const permisosCallsBefore = port.permisosEfectivosDeUsuarioCalls.length;

    await user.click(toggle);

    await waitFor(() =>
      expect(port.asignarRolAUsuarioCalls).toEqual([{ usuarioId: "usr-1", rolId: "rol-supervisor", signal: undefined }]),
    );
    await waitFor(() =>
      expect(port.permisosEfectivosDeUsuarioCalls.length).toBeGreaterThan(permisosCallsBefore),
    );
    await waitFor(() => expect(onRolesChanged).toHaveBeenCalled());
  });

  it("renders effective permisos grouped by categoría", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarRolesResponse = [];
    port.rolesDeUsuarioResponse = [];
    port.permisosEfectivosDeUsuarioResponse = [
      makeFakePermiso({ codigo: "ventas:crear", categoria: "ventas" }),
      makeFakePermiso({ codigo: "usuarios:ver", categoria: "usuarios" }),
    ];

    renderPanel(port);

    await waitFor(() => expect(screen.getByText("usuarios:ver")).toBeInTheDocument());
    expect(screen.getByText("ventas:crear")).toBeInTheDocument();
    expect(screen.getByText("usuarios")).toBeInTheDocument();
    expect(screen.getByText("ventas")).toBeInTheDocument();
  });

  it("anti-lockout: no puede quitarse su propio rol inmutable — switch disabled+checked y no se apaga", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const usuario = makeFakeUsuario({ id: "usr-1", firebaseUid: "fbuid-brenda" });
    const superAdmin = makeFakeRol({ id: "rol-super-admin", nombre: "super_admin", inmutable: true });
    port.listarRolesResponse = [superAdmin];
    port.rolesDeUsuarioResponse = [superAdmin];
    port.permisosEfectivosDeUsuarioResponse = [];

    renderPanel(port, usuario);

    const toggle = await screen.findByRole("switch", {
      name: "No puedes quitarte tu propio rol super_admin",
    });
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();

    await user.click(toggle);

    expect(port.quitarRolAUsuarioCalls).toHaveLength(0);
    expect(port.asignarRolAUsuarioCalls).toHaveLength(0);
  });

  it("un rol inmutable de OTRO usuario sí se puede quitar (el bloqueo es solo para el propio)", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const usuario = makeFakeUsuario({ id: "usr-otro", firebaseUid: "fbuid-otro" });
    const superAdmin = makeFakeRol({ id: "rol-super-admin", nombre: "super_admin", inmutable: true });
    port.listarRolesResponse = [superAdmin];
    port.rolesDeUsuarioResponse = [superAdmin];
    port.permisosEfectivosDeUsuarioResponse = [];

    renderPanel(port, usuario);

    const toggle = await screen.findByRole("switch", { name: "Quitar rol super_admin" });
    expect(toggle).not.toBeDisabled();

    await user.click(toggle);

    await waitFor(() =>
      expect(port.quitarRolAUsuarioCalls).toEqual([
        { usuarioId: "usr-otro", rolId: "rol-super-admin", signal: undefined },
      ]),
    );
  });
});
