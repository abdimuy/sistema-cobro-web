import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpUsuariosRolesAdapter } from "./HttpUsuariosRolesAdapter";
import type {
  ListResponseDTO,
  PermisoResponseDTO,
  RolResponseDTO,
  UsuarioResponseDTO,
} from "./dtos";

function makeUsuarioDTO(overrides: Partial<UsuarioResponseDTO> = {}): UsuarioResponseDTO {
  return {
    id: "usr-brenda",
    firebase_uid: "fbuid-brenda",
    email: "brenda.sanchez@muebleriamsp.mx",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    activo: true,
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

function makeRolDTO(overrides: Partial<RolResponseDTO> = {}): RolResponseDTO {
  return {
    id: "rol-supervisor",
    nombre: "supervisor",
    description: "supervisa cobranza y ventas de su zona",
    inmutable: false,
    activo: true,
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

function makePermisoDTO(overrides: Partial<PermisoResponseDTO> = {}): PermisoResponseDTO {
  return {
    codigo: "usuarios:ver",
    description: "ver el directorio de usuarios",
    categoria: "usuarios",
    ...overrides,
  };
}

function makeStubClient() {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  const client = { get, post, patch, delete: del } as unknown as AxiosInstance;
  return { client, get, post, patch, del };
}

describe("HttpUsuariosRolesAdapter", () => {
  it("listarUsuarios hace GET a /usuarios y mapea los items", async () => {
    const { client, get } = makeStubClient();
    const data: ListResponseDTO<UsuarioResponseDTO> = { items: [makeUsuarioDTO()] };
    get.mockResolvedValue({ data });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.listarUsuarios();

    expect(get).toHaveBeenCalledWith("/usuarios", { params: undefined, signal: undefined });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("usr-brenda");
    expect(result[0].firebaseUid).toBe("fbuid-brenda");
  });

  it("listarUsuarios sigue next_cursor (via ?after=) hasta que la última página no lo trae, concatenando items", async () => {
    const { client, get } = makeStubClient();
    get
      .mockResolvedValueOnce({
        data: {
          items: [makeUsuarioDTO({ id: "usr-1" })],
          next_cursor: "cursor-1",
        } satisfies ListResponseDTO<UsuarioResponseDTO>,
      })
      .mockResolvedValueOnce({
        data: {
          items: [makeUsuarioDTO({ id: "usr-2" })],
        } satisfies ListResponseDTO<UsuarioResponseDTO>,
      });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.listarUsuarios();

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, "/usuarios", { params: undefined, signal: undefined });
    expect(get).toHaveBeenNthCalledWith(2, "/usuarios", {
      params: { after: "cursor-1" },
      signal: undefined,
    });
    expect(result.map((u) => u.id)).toEqual(["usr-1", "usr-2"]);
  });

  it("listarUsuarios propaga el abort signal", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [] } });
    const adapter = new HttpUsuariosRolesAdapter(client);
    const ctrl = new AbortController();

    await adapter.listarUsuarios(ctrl.signal);

    expect(get).toHaveBeenCalledWith("/usuarios", { params: undefined, signal: ctrl.signal });
  });

  it("rolesDeUsuario hace GET a /usuarios/{id}/roles y mapea los items", async () => {
    const { client, get } = makeStubClient();
    const data: ListResponseDTO<RolResponseDTO> = { items: [makeRolDTO()] };
    get.mockResolvedValue({ data });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.rolesDeUsuario("usr-brenda");

    expect(get).toHaveBeenCalledWith("/usuarios/usr-brenda/roles", {
      params: undefined,
      signal: undefined,
    });
    expect(result).toEqual([
      {
        id: "rol-supervisor",
        nombre: "supervisor",
        description: "supervisa cobranza y ventas de su zona",
        inmutable: false,
        activo: true,
      },
    ]);
  });

  it("rolesDeUsuario codifica el usuarioId en la URL", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [] } });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.rolesDeUsuario("usr con espacio");

    expect(get).toHaveBeenCalledWith("/usuarios/usr%20con%20espacio/roles", {
      params: undefined,
      signal: undefined,
    });
  });

  it("permisosEfectivosDeUsuario hace GET a /usuarios/{id}/permisos", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [makePermisoDTO()] } });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.permisosEfectivosDeUsuario("usr-brenda");

    expect(get).toHaveBeenCalledWith("/usuarios/usr-brenda/permisos", {
      params: undefined,
      signal: undefined,
    });
    expect(result[0].codigo).toBe("usuarios:ver");
  });

  it("asignarRolAUsuario hace POST a /usuarios/{id}/roles con { rol_id }", async () => {
    const { client, post } = makeStubClient();
    post.mockResolvedValue({ data: {} });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.asignarRolAUsuario("usr-brenda", "rol-supervisor");

    expect(post).toHaveBeenCalledWith(
      "/usuarios/usr-brenda/roles",
      { rol_id: "rol-supervisor" },
      { signal: undefined },
    );
  });

  it("quitarRolAUsuario hace DELETE a /usuarios/{id}/roles/{rol_id}", async () => {
    const { client, del } = makeStubClient();
    del.mockResolvedValue({ data: {} });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.quitarRolAUsuario("usr-brenda", "rol-supervisor");

    expect(del).toHaveBeenCalledWith("/usuarios/usr-brenda/roles/rol-supervisor", {
      signal: undefined,
    });
  });

  it("listarRoles hace GET a /roles y sigue next_cursor", async () => {
    const { client, get } = makeStubClient();
    get
      .mockResolvedValueOnce({
        data: { items: [makeRolDTO({ id: "rol-1" })], next_cursor: "c1" },
      })
      .mockResolvedValueOnce({ data: { items: [makeRolDTO({ id: "rol-2" })] } });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.listarRoles();

    expect(get).toHaveBeenCalledTimes(2);
    expect(result.map((r) => r.id)).toEqual(["rol-1", "rol-2"]);
  });

  it("permisosDeRol hace GET a /roles/{id}/permisos", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [makePermisoDTO()] } });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.permisosDeRol("rol-supervisor");

    expect(get).toHaveBeenCalledWith("/roles/rol-supervisor/permisos", {
      params: undefined,
      signal: undefined,
    });
    expect(result).toHaveLength(1);
  });

  it("crearRol hace POST a /roles con el body snake_case y omite description cuando es undefined", async () => {
    const { client, post } = makeStubClient();
    post.mockResolvedValue({ data: makeRolDTO({ nombre: "cobrador", description: null }) });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.crearRol({ nombre: "cobrador" });

    expect(post).toHaveBeenCalledWith("/roles", { nombre: "cobrador" }, { signal: undefined });
    const [, body] = post.mock.calls[0];
    expect("description" in body).toBe(false);
    expect(result.nombre).toBe("cobrador");
  });

  it("crearRol envía description explícito (incluyendo null) cuando el caller lo define", async () => {
    const { client, post } = makeStubClient();
    post.mockResolvedValue({ data: makeRolDTO() });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.crearRol({ nombre: "cobrador", description: null });

    expect(post).toHaveBeenCalledWith(
      "/roles",
      { nombre: "cobrador", description: null },
      { signal: undefined },
    );
  });

  it("actualizarRol hace PATCH a /roles/{id} con el body snake_case", async () => {
    const { client, patch } = makeStubClient();
    patch.mockResolvedValue({ data: makeRolDTO({ nombre: "supervisor senior" }) });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.actualizarRol("rol-supervisor", {
      nombre: "supervisor senior",
      description: "descripción actualizada",
    });

    expect(patch).toHaveBeenCalledWith(
      "/roles/rol-supervisor",
      { nombre: "supervisor senior", description: "descripción actualizada" },
      { signal: undefined },
    );
    expect(result.nombre).toBe("supervisor senior");
  });

  it("eliminarRol hace DELETE a /roles/{id}", async () => {
    const { client, del } = makeStubClient();
    del.mockResolvedValue({ data: {} });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.eliminarRol("rol-supervisor");

    expect(del).toHaveBeenCalledWith("/roles/rol-supervisor", { signal: undefined });
  });

  it("asignarPermisoARol hace POST a /roles/{id}/permisos con { codigo } y lo codifica en el body tal cual (contiene ':')", async () => {
    const { client, post } = makeStubClient();
    post.mockResolvedValue({ data: {} });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.asignarPermisoARol("rol-supervisor", "usuarios:ver");

    expect(post).toHaveBeenCalledWith(
      "/roles/rol-supervisor/permisos",
      { codigo: "usuarios:ver" },
      { signal: undefined },
    );
  });

  it("quitarPermisoDeRol hace DELETE a /roles/{id}/permisos/{codigo} codificando el ':' en la URL", async () => {
    const { client, del } = makeStubClient();
    del.mockResolvedValue({ data: {} });
    const adapter = new HttpUsuariosRolesAdapter(client);

    await adapter.quitarPermisoDeRol("rol-supervisor", "usuarios:ver");

    expect(del).toHaveBeenCalledWith(
      "/roles/rol-supervisor/permisos/usuarios%3Aver",
      { signal: undefined },
    );
  });

  it("listarCatalogoPermisos hace GET a /permisos", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [makePermisoDTO(), makePermisoDTO({ codigo: "roles:crear" })] } });
    const adapter = new HttpUsuariosRolesAdapter(client);

    const result = await adapter.listarCatalogoPermisos();

    expect(get).toHaveBeenCalledWith("/permisos", { params: undefined, signal: undefined });
    expect(result).toHaveLength(2);
  });

  it("wrappea errores de GET (listarUsuarios) en DomainError con el code del backend", async () => {
    const { client, get } = makeStubClient();
    get.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 403"), {
        isAxiosError: true,
        response: { status: 403, data: { code: "forbidden", message: "forbidden" } },
      }),
    );
    const adapter = new HttpUsuariosRolesAdapter(client);

    await expect(adapter.listarUsuarios()).rejects.toMatchObject({
      name: "DomainError",
      code: "forbidden",
    });
  });

  it("wrappea errores de POST (crearRol) en DomainError", async () => {
    const { client, post } = makeStubClient();
    post.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 409"), {
        isAxiosError: true,
        response: { status: 409, data: { code: "rol_ya_existe", message: "ya existe" } },
      }),
    );
    const adapter = new HttpUsuariosRolesAdapter(client);

    await expect(adapter.crearRol({ nombre: "cobrador" })).rejects.toMatchObject({
      name: "DomainError",
      code: "rol_ya_existe",
    });
  });

  it("wrappea errores de DELETE (eliminarRol) en DomainError", async () => {
    const { client, del } = makeStubClient();
    del.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 403"), {
        isAxiosError: true,
        response: { status: 403, data: { code: "rol_inmutable", message: "inmutable" } },
      }),
    );
    const adapter = new HttpUsuariosRolesAdapter(client);

    await expect(adapter.eliminarRol("rol-super-admin")).rejects.toMatchObject({
      name: "DomainError",
      code: "rol_inmutable",
    });
  });

  it("wrappea errores de PATCH (actualizarRol) en DomainError", async () => {
    const { client, patch } = makeStubClient();
    patch.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 404"), {
        isAxiosError: true,
        response: { status: 404, data: { code: "rol_not_found", message: "no encontrado" } },
      }),
    );
    const adapter = new HttpUsuariosRolesAdapter(client);

    await expect(
      adapter.actualizarRol("rol-fantasma", { nombre: "x" }),
    ).rejects.toMatchObject({ name: "DomainError", code: "rol_not_found" });
  });
});
