import type { Usuario, Rol, Permiso } from "../../domain/entities";

// CrearRolInput carries the fields required to create a new rol.
// `description` is optional: omitted means "no description at all"
// (the HTTP adapter's mapper decides omit-vs-null semantics against the
// wire body — see domainToRolBody.ts).
export interface CrearRolInput {
  nombre: string;
  description?: string | null;
}

// ActualizarRolInput carries the fields a rename/update can change. Same
// shape as CrearRolInput today, kept as a distinct type because the two
// operations evolve independently (e.g. a future PATCH-only field).
export interface ActualizarRolInput {
  nombre: string;
  description?: string | null;
}

// UsuariosRolesPort is the outbound interface the usuariosRoles module
// requires from its host. The HTTP adapter satisfies it for production; an
// in-memory fake satisfies it for tests.
export interface UsuariosRolesPort {
  listarUsuarios(signal?: AbortSignal): Promise<Usuario[]>;
  rolesDeUsuario(usuarioId: string, signal?: AbortSignal): Promise<Rol[]>;
  permisosEfectivosDeUsuario(
    usuarioId: string,
    signal?: AbortSignal,
  ): Promise<Permiso[]>;
  asignarRolAUsuario(
    usuarioId: string,
    rolId: string,
    signal?: AbortSignal,
  ): Promise<void>;
  quitarRolAUsuario(
    usuarioId: string,
    rolId: string,
    signal?: AbortSignal,
  ): Promise<void>;

  listarRoles(signal?: AbortSignal): Promise<Rol[]>;
  permisosDeRol(rolId: string, signal?: AbortSignal): Promise<Permiso[]>;
  crearRol(input: CrearRolInput, signal?: AbortSignal): Promise<Rol>;
  actualizarRol(
    rolId: string,
    input: ActualizarRolInput,
    signal?: AbortSignal,
  ): Promise<Rol>;
  eliminarRol(rolId: string, signal?: AbortSignal): Promise<void>;
  asignarPermisoARol(
    rolId: string,
    codigo: string,
    signal?: AbortSignal,
  ): Promise<void>;
  quitarPermisoDeRol(
    rolId: string,
    codigo: string,
    signal?: AbortSignal,
  ): Promise<void>;

  listarCatalogoPermisos(signal?: AbortSignal): Promise<Permiso[]>;
}
