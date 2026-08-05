import type { AxiosInstance } from "axios";
import type {
  ActualizarRolInput,
  CrearRolInput,
  UsuariosRolesPort,
} from "../../application/ports/UsuariosRolesPort";
import type { Permiso, Rol, Usuario } from "../../domain/entities";
import type {
  AsignarPermisoBodyDTO,
  AsignarRolBodyDTO,
  ListResponseDTO,
  RolResponseDTO,
} from "./dtos";
import { dtoToUsuario } from "../mappers/dtoToUsuario";
import { dtoToRol } from "../mappers/dtoToRol";
import { dtoToPermiso } from "../mappers/dtoToPermiso";
import { domainToRolBody } from "../mappers/domainToRolBody";
import { apperrorToDomainError } from "../mappers/errorMapper";

// HttpUsuariosRolesAdapter is the production implementation of
// UsuariosRolesPort. It talks to /v2/usuarios, /v2/roles and /v2/permisos
// via the provided axios client (which injects the Firebase Bearer token).
// All errors are funnelled through apperrorToDomainError so callers only
// see DomainError instances.
export class HttpUsuariosRolesAdapter implements UsuariosRolesPort {
  constructor(private readonly client: AxiosInstance) {}

  async listarUsuarios(signal?: AbortSignal): Promise<Usuario[]> {
    try {
      return await this.fetchAllPages("/usuarios", dtoToUsuario, signal);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async rolesDeUsuario(usuarioId: string, signal?: AbortSignal): Promise<Rol[]> {
    try {
      return await this.fetchAllPages(
        `/usuarios/${encodeURIComponent(usuarioId)}/roles`,
        dtoToRol,
        signal,
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async permisosEfectivosDeUsuario(
    usuarioId: string,
    signal?: AbortSignal,
  ): Promise<Permiso[]> {
    try {
      return await this.fetchAllPages(
        `/usuarios/${encodeURIComponent(usuarioId)}/permisos`,
        dtoToPermiso,
        signal,
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async asignarRolAUsuario(
    usuarioId: string,
    rolId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      const body: AsignarRolBodyDTO = { rol_id: rolId };
      await this.client.post(
        `/usuarios/${encodeURIComponent(usuarioId)}/roles`,
        body,
        { signal },
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async quitarRolAUsuario(
    usuarioId: string,
    rolId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      await this.client.delete(
        `/usuarios/${encodeURIComponent(usuarioId)}/roles/${encodeURIComponent(rolId)}`,
        { signal },
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarRoles(signal?: AbortSignal): Promise<Rol[]> {
    try {
      return await this.fetchAllPages("/roles", dtoToRol, signal);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async permisosDeRol(rolId: string, signal?: AbortSignal): Promise<Permiso[]> {
    try {
      return await this.fetchAllPages(
        `/roles/${encodeURIComponent(rolId)}/permisos`,
        dtoToPermiso,
        signal,
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async crearRol(input: CrearRolInput, signal?: AbortSignal): Promise<Rol> {
    try {
      const body = domainToRolBody(input);
      const { data } = await this.client.post<RolResponseDTO>("/roles", body, {
        signal,
      });
      return dtoToRol(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async actualizarRol(
    rolId: string,
    input: ActualizarRolInput,
    signal?: AbortSignal,
  ): Promise<Rol> {
    try {
      const body = domainToRolBody(input);
      const { data } = await this.client.patch<RolResponseDTO>(
        `/roles/${encodeURIComponent(rolId)}`,
        body,
        { signal },
      );
      return dtoToRol(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async eliminarRol(rolId: string, signal?: AbortSignal): Promise<void> {
    try {
      await this.client.delete(`/roles/${encodeURIComponent(rolId)}`, { signal });
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async asignarPermisoARol(
    rolId: string,
    codigo: string,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      const body: AsignarPermisoBodyDTO = { codigo };
      await this.client.post(
        `/roles/${encodeURIComponent(rolId)}/permisos`,
        body,
        { signal },
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async quitarPermisoDeRol(
    rolId: string,
    codigo: string,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      await this.client.delete(
        `/roles/${encodeURIComponent(rolId)}/permisos/${encodeURIComponent(codigo)}`,
        { signal },
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarCatalogoPermisos(signal?: AbortSignal): Promise<Permiso[]> {
    try {
      return await this.fetchAllPages("/permisos", dtoToPermiso, signal);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  // fetchAllPages follows `next_cursor` (sent back as the `after` query
  // param, per internal/platform/pagination.FromRequest) until the backend
  // omits it, concatenating every page's `items` into a single array. List
  // endpoints in this module never expose pagination to the caller — the
  // catalogs involved (usuarios, roles, permisos) are all small enough that
  // "return everything" is the right contract for the port.
  //
  // Backstop: a well-behaved backend always advances the cursor, but a bug
  // (or a mock in a test) could echo the same `next_cursor` back forever.
  // We stop as soon as the cursor repeats, and cap iterations defensively
  // so a single bad page can never hang the caller.
  private async fetchAllPages<TDto, TDomain>(
    path: string,
    mapper: (dto: TDto) => TDomain,
    signal?: AbortSignal,
  ): Promise<TDomain[]> {
    const MAX_PAGES = 100;
    const results: TDomain[] = [];
    let after: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params: Record<string, string> | undefined = after
        ? { after }
        : undefined;
      const { data } = await this.client.get<ListResponseDTO<TDto>>(path, {
        params,
        signal,
      });
      results.push(...data.items.map(mapper));

      const nextAfter = data.next_cursor || undefined;
      if (!nextAfter || nextAfter === after) break;
      after = nextAfter;
    }

    return results;
  }
}
