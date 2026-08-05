import { http, HttpResponse } from "msw";
import type {
  ListResponseDTO,
  PermisoResponseDTO,
  RolResponseDTO,
  UsuarioResponseDTO,
} from "../../../modules/usuariosRoles/infrastructure/http/dtos";

// All usuariosRoles MSW handlers live here, keyed off the URL pattern the
// production adapter (HttpUsuariosRolesAdapter) uses. Tests register them via
// `server.use(...usuariosRolesHandlers({...}))` and can override any single
// endpoint afterwards with `server.use(http.get(...))`.
export const USUARIOS_ROLES_BASE = "*/v2";

type ErrorBody = Record<string, unknown>;
type CrearRolBody = { nombre: string; description?: string | null };
type ActualizarRolBody = { nombre: string; description?: string | null };

function defaultRol(id: string, body: CrearRolBody | ActualizarRolBody): RolResponseDTO {
  return {
    id,
    nombre: body.nombre,
    description: body.description ?? null,
    inmutable: false,
    activo: true,
    created_at: "2026-08-05T00:00:00Z",
    updated_at: "2026-08-05T00:00:00Z",
  };
}

export type UsuariosRolesHandlerOptions = {
  usuarios?: { items?: UsuarioResponseDTO[] };
  rolesDeUsuario?: { byUsuarioId?: Record<string, RolResponseDTO[]> };
  permisosDeUsuario?: { byUsuarioId?: Record<string, PermisoResponseDTO[]> };
  asignarRolAUsuario?: {
    assertCall?: (usuarioId: string, rolId: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  quitarRolAUsuario?: {
    assertCall?: (usuarioId: string, rolId: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  roles?: { items?: RolResponseDTO[] };
  permisosDeRol?: { byRolId?: Record<string, PermisoResponseDTO[]> };
  crearRol?: {
    response?: RolResponseDTO;
    assertCall?: (input: CrearRolBody) => void;
    error?: { status: number; body: ErrorBody };
  };
  actualizarRol?: {
    response?: RolResponseDTO;
    assertCall?: (rolId: string, input: ActualizarRolBody) => void;
    error?: { status: number; body: ErrorBody };
  };
  eliminarRol?: { assertCall?: (rolId: string) => void; error?: { status: number; body: ErrorBody } };
  asignarPermisoARol?: {
    assertCall?: (rolId: string, codigo: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  quitarPermisoDeRol?: {
    assertCall?: (rolId: string, codigo: string) => void;
    error?: { status: number; body: ErrorBody };
  };
  permisos?: { items?: PermisoResponseDTO[] };
};

export function usuariosRolesHandlers(opts: UsuariosRolesHandlerOptions = {}) {
  const o = opts;
  return [
    http.get(`${USUARIOS_ROLES_BASE}/usuarios`, () =>
      HttpResponse.json({ items: o.usuarios?.items ?? [] } satisfies ListResponseDTO<UsuarioResponseDTO>),
    ),

    http.get(`${USUARIOS_ROLES_BASE}/usuarios/:id/roles`, ({ params }) => {
      const id = String(params.id);
      return HttpResponse.json({
        items: o.rolesDeUsuario?.byUsuarioId?.[id] ?? [],
      } satisfies ListResponseDTO<RolResponseDTO>);
    }),

    http.get(`${USUARIOS_ROLES_BASE}/usuarios/:id/permisos`, ({ params }) => {
      const id = String(params.id);
      return HttpResponse.json({
        items: o.permisosDeUsuario?.byUsuarioId?.[id] ?? [],
      } satisfies ListResponseDTO<PermisoResponseDTO>);
    }),

    http.post(`${USUARIOS_ROLES_BASE}/usuarios/:id/roles`, async ({ params, request }) => {
      const id = String(params.id);
      const body = (await request.json()) as { rol_id: string };
      o.asignarRolAUsuario?.assertCall?.(id, body.rol_id);
      if (o.asignarRolAUsuario?.error) {
        return HttpResponse.json(o.asignarRolAUsuario.error.body, { status: o.asignarRolAUsuario.error.status });
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(`${USUARIOS_ROLES_BASE}/usuarios/:id/roles/:rolId`, ({ params }) => {
      const id = String(params.id);
      const rolId = String(params.rolId);
      o.quitarRolAUsuario?.assertCall?.(id, rolId);
      if (o.quitarRolAUsuario?.error) {
        return HttpResponse.json(o.quitarRolAUsuario.error.body, { status: o.quitarRolAUsuario.error.status });
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.get(`${USUARIOS_ROLES_BASE}/roles`, () =>
      HttpResponse.json({ items: o.roles?.items ?? [] } satisfies ListResponseDTO<RolResponseDTO>),
    ),

    http.get(`${USUARIOS_ROLES_BASE}/roles/:id/permisos`, ({ params }) => {
      const id = String(params.id);
      return HttpResponse.json({
        items: o.permisosDeRol?.byRolId?.[id] ?? [],
      } satisfies ListResponseDTO<PermisoResponseDTO>);
    }),

    http.post(`${USUARIOS_ROLES_BASE}/roles`, async ({ request }) => {
      const body = (await request.json()) as CrearRolBody;
      o.crearRol?.assertCall?.(body);
      if (o.crearRol?.error) {
        return HttpResponse.json(o.crearRol.error.body, { status: o.crearRol.error.status });
      }
      return HttpResponse.json(o.crearRol?.response ?? defaultRol("rol-nuevo", body));
    }),

    http.patch(`${USUARIOS_ROLES_BASE}/roles/:id`, async ({ params, request }) => {
      const id = String(params.id);
      const body = (await request.json()) as ActualizarRolBody;
      o.actualizarRol?.assertCall?.(id, body);
      if (o.actualizarRol?.error) {
        return HttpResponse.json(o.actualizarRol.error.body, { status: o.actualizarRol.error.status });
      }
      return HttpResponse.json(o.actualizarRol?.response ?? defaultRol(id, body));
    }),

    http.delete(`${USUARIOS_ROLES_BASE}/roles/:id`, ({ params }) => {
      const id = String(params.id);
      o.eliminarRol?.assertCall?.(id);
      if (o.eliminarRol?.error) {
        return HttpResponse.json(o.eliminarRol.error.body, { status: o.eliminarRol.error.status });
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(`${USUARIOS_ROLES_BASE}/roles/:id/permisos`, async ({ params, request }) => {
      const id = String(params.id);
      const body = (await request.json()) as { codigo: string };
      o.asignarPermisoARol?.assertCall?.(id, body.codigo);
      if (o.asignarPermisoARol?.error) {
        return HttpResponse.json(o.asignarPermisoARol.error.body, { status: o.asignarPermisoARol.error.status });
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(`${USUARIOS_ROLES_BASE}/roles/:id/permisos/:codigo`, ({ params }) => {
      const id = String(params.id);
      const codigo = String(params.codigo);
      o.quitarPermisoDeRol?.assertCall?.(id, codigo);
      if (o.quitarPermisoDeRol?.error) {
        return HttpResponse.json(o.quitarPermisoDeRol.error.body, { status: o.quitarPermisoDeRol.error.status });
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.get(`${USUARIOS_ROLES_BASE}/permisos`, () =>
      HttpResponse.json({ items: o.permisos?.items ?? [] } satisfies ListResponseDTO<PermisoResponseDTO>),
    ),
  ];
}
