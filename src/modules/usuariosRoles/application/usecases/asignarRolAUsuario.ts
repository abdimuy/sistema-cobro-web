import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";

// asignarRolAUsuario delegates directly to the port.
export async function asignarRolAUsuario(
  port: UsuariosRolesPort,
  usuarioId: string,
  rolId: string,
  signal?: AbortSignal,
): Promise<void> {
  return port.asignarRolAUsuario(usuarioId, rolId, signal);
}
