import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";

// eliminarRol delegates directly to the port.
export async function eliminarRol(
  port: UsuariosRolesPort,
  rolId: string,
  signal?: AbortSignal,
): Promise<void> {
  return port.eliminarRol(rolId, signal);
}
