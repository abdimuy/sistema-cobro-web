import { describe, expect, it, vi } from "vitest";
import axios from "axios";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { server } from "../../../../test/msw/server";
import { usuariosRolesHandlers } from "../../../../test/msw/handlers/usuariosRoles";
import { UsuariosRolesProvider } from "../../presentation/context/UsuariosRolesContext";
import { HttpUsuariosRolesAdapter } from "../../infrastructure/http/HttpUsuariosRolesAdapter";
import { UsuariosRolesScreen } from "../UsuariosRolesScreen";
import type { PermisoResponseDTO, RolResponseDTO, UsuarioResponseDTO } from "../../infrastructure/http/dtos";

const TEST_BASE = "http://api.test/v2";

function setupScreen() {
  const client = axios.create({ baseURL: TEST_BASE });
  const port = new HttpUsuariosRolesAdapter(client);
  return render(
    <UsuariosRolesProvider port={port}>
      <UsuariosRolesScreen />
    </UsuariosRolesProvider>,
  );
}

const brendaDTO: UsuarioResponseDTO = {
  id: "usr-brenda",
  firebase_uid: "fbuid-brenda",
  email: "brenda.sanchez@muebleriamsp.mx",
  nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
  activo: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const carlosDTO: UsuarioResponseDTO = {
  id: "usr-carlos",
  firebase_uid: "fbuid-carlos",
  email: "carlos.ramos@muebleriamsp.mx",
  nombre: "CARLOS RAMOS LUNA",
  activo: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const supervisorRolDTO: RolResponseDTO = {
  id: "rol-supervisor",
  nombre: "supervisor",
  description: "supervisa cobranza y ventas de su zona",
  inmutable: false,
  activo: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const permisoVerDTO: PermisoResponseDTO = {
  codigo: "usuarios:ver",
  description: "ver el directorio de usuarios",
  categoria: "usuarios",
};

describe("UsuariosRolesScreen integration", () => {
  it("carga usuarios y hace fan-out en paralelo a rolesDeUsuario por cada uno", async () => {
    server.use(
      ...usuariosRolesHandlers({
        usuarios: { items: [brendaDTO, carlosDTO] },
        rolesDeUsuario: {
          byUsuarioId: {
            "usr-brenda": [supervisorRolDTO],
            "usr-carlos": [],
          },
        },
        roles: { items: [supervisorRolDTO] },
        permisos: { items: [permisoVerDTO] },
      }),
    );

    setupScreen();

    await waitFor(() => expect(screen.getByText("BRENDA GUADALUPE SÁNCHEZ RUIZ")).toBeInTheDocument());
    expect(screen.getByText("CARLOS RAMOS LUNA")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Sin roles")).toBeInTheDocument());
  });

  it("crear rol (POST /v2/roles) — el diálogo cierra tras la respuesta", async () => {
    const user = userEvent.setup();
    let crearInput: { nombre: string; description?: string | null } | null = null;

    server.use(
      ...usuariosRolesHandlers({
        usuarios: { items: [] },
        roles: { items: [supervisorRolDTO] },
        permisos: { items: [] },
        crearRol: {
          assertCall: (input) => {
            crearInput = input;
          },
          response: {
            id: "rol-cajero",
            nombre: "cajero",
            description: null,
            inmutable: false,
            activo: true,
            created_at: "2026-08-05T00:00:00Z",
            updated_at: "2026-08-05T00:00:00Z",
          },
        },
      }),
    );

    setupScreen();

    await user.click(screen.getByRole("tab", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Nuevo rol/ }));
    await user.type(screen.getByLabelText("Nombre"), "cajero");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => expect(crearInput).toEqual({ nombre: "cajero", description: undefined }));
    await waitFor(() => expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument());
  });

  it("asignar permiso a un rol (POST /v2/roles/:id/permisos)", async () => {
    const user = userEvent.setup();
    let asignado: { rolId: string; codigo: string } | null = null;

    server.use(
      ...usuariosRolesHandlers({
        usuarios: { items: [] },
        roles: { items: [supervisorRolDTO] },
        permisos: { items: [permisoVerDTO] },
        permisosDeRol: { byRolId: { "rol-supervisor": [] } },
        asignarPermisoARol: {
          assertCall: (rolId, codigo) => {
            asignado = { rolId, codigo };
          },
        },
      }),
    );

    setupScreen();

    await user.click(screen.getByRole("tab", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Ver rol supervisor" }));

    const checkbox = await screen.findByRole("checkbox", { name: "usuarios:ver" });
    await user.click(checkbox);

    await waitFor(() => expect(asignado).toEqual({ rolId: "rol-supervisor", codigo: "usuarios:ver" }));
  });

  it("eliminar rol (DELETE /v2/roles/:id)", async () => {
    const user = userEvent.setup();
    let eliminadoId: string | null = null;

    server.use(
      ...usuariosRolesHandlers({
        usuarios: { items: [] },
        roles: { items: [supervisorRolDTO] },
        permisos: { items: [] },
        permisosDeRol: { byRolId: { "rol-supervisor": [] } },
        eliminarRol: {
          assertCall: (rolId) => {
            eliminadoId = rolId;
          },
        },
      }),
    );

    setupScreen();

    await user.click(screen.getByRole("tab", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("supervisor")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Ver rol supervisor" }));

    await user.click(await screen.findByRole("button", { name: "Eliminar rol" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(eliminadoId).toBe("rol-supervisor"));
  });
});
