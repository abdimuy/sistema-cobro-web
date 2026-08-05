import type {
  ActualizarRolInput,
  CrearRolInput,
  UsuariosRolesPort,
} from "../ports/UsuariosRolesPort";
import type { Permiso, Rol, Usuario } from "../../domain/entities";

// FakeUsuariosRolesPort is a hand-rolled in-memory implementation of
// UsuariosRolesPort that records every call. Hook/screen tests use it to
// assert behavior without standing up MSW or a real HTTP adapter.
export class FakeUsuariosRolesPort implements UsuariosRolesPort {
  listarUsuariosCalls: Array<{ signal?: AbortSignal }> = [];
  rolesDeUsuarioCalls: Array<{ usuarioId: string; signal?: AbortSignal }> = [];
  permisosEfectivosDeUsuarioCalls: Array<{
    usuarioId: string;
    signal?: AbortSignal;
  }> = [];
  asignarRolAUsuarioCalls: Array<{
    usuarioId: string;
    rolId: string;
    signal?: AbortSignal;
  }> = [];
  quitarRolAUsuarioCalls: Array<{
    usuarioId: string;
    rolId: string;
    signal?: AbortSignal;
  }> = [];
  listarRolesCalls: Array<{ signal?: AbortSignal }> = [];
  permisosDeRolCalls: Array<{ rolId: string; signal?: AbortSignal }> = [];
  crearRolCalls: Array<{ input: CrearRolInput; signal?: AbortSignal }> = [];
  actualizarRolCalls: Array<{
    rolId: string;
    input: ActualizarRolInput;
    signal?: AbortSignal;
  }> = [];
  eliminarRolCalls: Array<{ rolId: string; signal?: AbortSignal }> = [];
  asignarPermisoARolCalls: Array<{
    rolId: string;
    codigo: string;
    signal?: AbortSignal;
  }> = [];
  quitarPermisoDeRolCalls: Array<{
    rolId: string;
    codigo: string;
    signal?: AbortSignal;
  }> = [];
  listarCatalogoPermisosCalls: Array<{ signal?: AbortSignal }> = [];

  listarUsuariosResponse: Usuario[] | (() => Usuario[]) = [];
  rolesDeUsuarioResponse: Rol[] | (() => Rol[]) = [];
  permisosEfectivosDeUsuarioResponse: Permiso[] | (() => Permiso[]) = [];
  listarRolesResponse: Rol[] | (() => Rol[]) = [];
  permisosDeRolResponse: Permiso[] | (() => Permiso[]) = [];
  crearRolResponse: Rol | ((input: CrearRolInput) => Rol) = makeFakeRol();
  actualizarRolResponse:
    | Rol
    | ((rolId: string, input: ActualizarRolInput) => Rol) = makeFakeRol();
  listarCatalogoPermisosResponse: Permiso[] | (() => Permiso[]) = [];

  // When set, the next call to that method throws this error.
  throwOnNext: Partial<Record<keyof UsuariosRolesPort, Error>> = {};

  async listarUsuarios(signal?: AbortSignal): Promise<Usuario[]> {
    this.listarUsuariosCalls.push({ signal });
    const e = this.takeThrow("listarUsuarios");
    if (e) throw e;
    return resolve(this.listarUsuariosResponse);
  }

  async rolesDeUsuario(usuarioId: string, signal?: AbortSignal): Promise<Rol[]> {
    this.rolesDeUsuarioCalls.push({ usuarioId, signal });
    const e = this.takeThrow("rolesDeUsuario");
    if (e) throw e;
    return resolve(this.rolesDeUsuarioResponse);
  }

  async permisosEfectivosDeUsuario(
    usuarioId: string,
    signal?: AbortSignal,
  ): Promise<Permiso[]> {
    this.permisosEfectivosDeUsuarioCalls.push({ usuarioId, signal });
    const e = this.takeThrow("permisosEfectivosDeUsuario");
    if (e) throw e;
    return resolve(this.permisosEfectivosDeUsuarioResponse);
  }

  async asignarRolAUsuario(
    usuarioId: string,
    rolId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    this.asignarRolAUsuarioCalls.push({ usuarioId, rolId, signal });
    const e = this.takeThrow("asignarRolAUsuario");
    if (e) throw e;
  }

  async quitarRolAUsuario(
    usuarioId: string,
    rolId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    this.quitarRolAUsuarioCalls.push({ usuarioId, rolId, signal });
    const e = this.takeThrow("quitarRolAUsuario");
    if (e) throw e;
  }

  async listarRoles(signal?: AbortSignal): Promise<Rol[]> {
    this.listarRolesCalls.push({ signal });
    const e = this.takeThrow("listarRoles");
    if (e) throw e;
    return resolve(this.listarRolesResponse);
  }

  async permisosDeRol(rolId: string, signal?: AbortSignal): Promise<Permiso[]> {
    this.permisosDeRolCalls.push({ rolId, signal });
    const e = this.takeThrow("permisosDeRol");
    if (e) throw e;
    return resolve(this.permisosDeRolResponse);
  }

  async crearRol(input: CrearRolInput, signal?: AbortSignal): Promise<Rol> {
    this.crearRolCalls.push({ input, signal });
    const e = this.takeThrow("crearRol");
    if (e) throw e;
    const r = this.crearRolResponse;
    return typeof r === "function" ? r(input) : r;
  }

  async actualizarRol(
    rolId: string,
    input: ActualizarRolInput,
    signal?: AbortSignal,
  ): Promise<Rol> {
    this.actualizarRolCalls.push({ rolId, input, signal });
    const e = this.takeThrow("actualizarRol");
    if (e) throw e;
    const r = this.actualizarRolResponse;
    return typeof r === "function" ? r(rolId, input) : r;
  }

  async eliminarRol(rolId: string, signal?: AbortSignal): Promise<void> {
    this.eliminarRolCalls.push({ rolId, signal });
    const e = this.takeThrow("eliminarRol");
    if (e) throw e;
  }

  async asignarPermisoARol(
    rolId: string,
    codigo: string,
    signal?: AbortSignal,
  ): Promise<void> {
    this.asignarPermisoARolCalls.push({ rolId, codigo, signal });
    const e = this.takeThrow("asignarPermisoARol");
    if (e) throw e;
  }

  async quitarPermisoDeRol(
    rolId: string,
    codigo: string,
    signal?: AbortSignal,
  ): Promise<void> {
    this.quitarPermisoDeRolCalls.push({ rolId, codigo, signal });
    const e = this.takeThrow("quitarPermisoDeRol");
    if (e) throw e;
  }

  async listarCatalogoPermisos(signal?: AbortSignal): Promise<Permiso[]> {
    this.listarCatalogoPermisosCalls.push({ signal });
    const e = this.takeThrow("listarCatalogoPermisos");
    if (e) throw e;
    return resolve(this.listarCatalogoPermisosResponse);
  }

  private takeThrow(method: keyof UsuariosRolesPort): Error | undefined {
    const e = this.throwOnNext[method];
    if (e) {
      delete this.throwOnNext[method];
      return e;
    }
    return undefined;
  }
}

function resolve<T>(v: T | (() => T)): T {
  return typeof v === "function" ? (v as () => T)() : v;
}

export function makeFakeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  const base: Usuario = {
    id: "usr-brenda",
    firebaseUid: "fbuid-brenda",
    email: "brenda.sanchez@muebleriamsp.mx",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    activo: true,
  };
  return { ...base, ...overrides };
}

export function makeFakeRol(overrides: Partial<Rol> = {}): Rol {
  const base: Rol = {
    id: "rol-supervisor",
    nombre: "supervisor",
    description: "supervisa cobranza y ventas de su zona",
    inmutable: false,
    activo: true,
  };
  return { ...base, ...overrides };
}

export function makeFakePermiso(overrides: Partial<Permiso> = {}): Permiso {
  const base: Permiso = {
    codigo: "usuarios:ver",
    description: "ver el directorio de usuarios",
    categoria: "usuarios",
  };
  return { ...base, ...overrides };
}
