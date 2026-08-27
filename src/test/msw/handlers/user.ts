import { http, HttpResponse } from "msw";
import type { UsuarioResponseDTO } from "../../../modules/user/infrastructure/http/dtos";

// All user-module MSW handlers live here, keyed off the URL pattern the
// production adapter (HttpUserAdapter) uses. Tests register them via
// `server.use(...userHandlers({...}))` and can override the endpoint
// afterwards with `server.use(http.post(...))`.
export const USUARIOS_BASE = "*/v2/usuarios";

type ErrorBody = Record<string, unknown>;

export type UserHandlerOptions = {
  crearUsuario?: {
    // Body observado por la prueba. Recibe el JSON tal cual salió del cliente.
    assertCall?: (body: unknown, headers: Headers) => void;
    // Respuesta 201. Por default se refleja lo enviado, como hace el backend.
    response?: UsuarioResponseDTO;
    error?: { status: number; body: ErrorBody };
    // Cuando es true el handler corta la conexión (fallo de red, no HTTP).
    networkError?: boolean;
  };
};

function defaultUsuario(body: Record<string, unknown>): UsuarioResponseDTO {
  return {
    id: "usr-nuevo",
    firebase_uid: String(body.firebase_uid ?? ""),
    email: String(body.email ?? ""),
    nombre: String(body.nombre ?? ""),
    telefono: typeof body.telefono === "string" ? body.telefono : null,
    almacen_id: null,
    activo: true,
    created_at: "2026-08-27T12:00:00Z",
    updated_at: "2026-08-27T12:00:00Z",
  };
}

export function userHandlers(opts: UserHandlerOptions = {}) {
  const o = opts;
  return [
    http.post(USUARIOS_BASE, async ({ request }) => {
      if (o.crearUsuario?.networkError) {
        return HttpResponse.error();
      }
      const body = (await request.json()) as Record<string, unknown>;
      o.crearUsuario?.assertCall?.(body, request.headers);
      if (o.crearUsuario?.error) {
        return HttpResponse.json(o.crearUsuario.error.body, {
          status: o.crearUsuario.error.status,
        });
      }
      return HttpResponse.json(o.crearUsuario?.response ?? defaultUsuario(body), {
        status: 201,
      });
    }),
  ];
}
