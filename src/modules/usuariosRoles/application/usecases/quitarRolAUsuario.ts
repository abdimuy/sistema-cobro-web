import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";

// quitarRolAUsuario delegates directly to the port.
export async function quitarRolAUsuario(
  port: UsuariosRolesPort,
  usuarioId: string,
  rolId: string,
  signal?: AbortSignal,
): Promise<void> {
  return port.quitarRolAUsuario(usuarioId, rolId, signal);
}
