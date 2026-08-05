import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";

// quitarPermisoDeRol delegates directly to the port.
export async function quitarPermisoDeRol(
  port: UsuariosRolesPort,
  rolId: string,
  codigo: string,
  signal?: AbortSignal,
): Promise<void> {
  return port.quitarPermisoDeRol(rolId, codigo, signal);
}
