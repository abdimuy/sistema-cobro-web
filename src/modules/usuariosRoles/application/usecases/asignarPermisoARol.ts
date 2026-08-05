import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";

// asignarPermisoARol delegates directly to the port.
export async function asignarPermisoARol(
  port: UsuariosRolesPort,
  rolId: string,
  codigo: string,
  signal?: AbortSignal,
): Promise<void> {
  return port.asignarPermisoARol(rolId, codigo, signal);
}
