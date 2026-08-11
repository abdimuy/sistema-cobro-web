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

  it("marca el permiso de forma optimista y deja el resto de checkboxes activos (no se comen clics)", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const rol = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor", inmutable: false });
    port.listarCatalogoPermisosResponse = [
      makeFakePermiso({ codigo: "ventas:crear", categoria: "ventas" }),
      makeFakePermiso({ codigo: "ventas:editar", categoria: "ventas" }),
    ];
    port.permisosDeRolResponse = [];

    renderPanel(port, rol);

    const crear = await screen.findByRole("checkbox", { name: "ventas:crear" });
    const editar = await screen.findByRole("checkbox", { name: "ventas:editar" });

    await user.click(crear);
    // Optimista: queda marcado de inmediato, sin esperar un refetch.
    expect(crear).toBeChecked();

    // El segundo checkbox sigue habilitado (no hay disabled global mientras guarda).
    expect(editar).toBeEnabled();
    await user.click(editar);
    expect(editar).toBeChecked();

    await waitFor(() => {
      expect(port.asignarPermisoARolCalls).toEqual([
        { rolId: "rol-supervisor", codigo: "ventas:crear", signal: undefined },
        { rolId: "rol-supervisor", codigo: "ventas:editar", signal: undefined },
      ]);
    });
  });

  it("serializa toggles de la misma llave: quitar espera a que asignar resuelva (evita la race on→off)", async () => {
    const user = userEvent.setup();
    const port = new FakeUsuariosRolesPort();
    const rol = makeFakeRol({ id: "rol-supervisor", nombre: "supervisor", inmutable: false });
    port.listarCatalogoPermisosResponse = [makeFakePermiso({ codigo: "usuarios:ver", categoria: "usuarios" })];
    port.permisosDeRolResponse = [];

    // Bloquea el asignar en una compuerta para simular latencia de red.
    let abrirCompuerta: () => void = () => {};
    const compuerta = new Promise<void>((res) => {
      abrirCompuerta = res;
    });
    port.asignarPermisoARol = async (rolId, codigo, signal) => {
      port.asignarPermisoARolCalls.push({ rolId, codigo, signal });
      await compuerta;
    };

    renderPanel(port, rol);

    const checkbox = await screen.findByRole("checkbox", { name: "usuarios:ver" });
    await user.click(checkbox); // asignar (bloqueado en la compuerta)
    await user.click(checkbox); // quitar (debe encolarse detrás del asignar)

    // quitar NO se ejecuta hasta que el asignar previo resuelva.
    expect(port.asignarPermisoARolCalls).toHaveLength(1);
    expect(port.quitarPermisoDeRolCalls).toHaveLength(0);

    abrirCompuerta();

    // Ya resuelto el asignar, el quitar encolado corre: estado final = quitado.
    await waitFor(() => expect(port.quitarPermisoDeRolCalls).toHaveLength(1));
    expect(checkbox).not.toBeChecked();
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
