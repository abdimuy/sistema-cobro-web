import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Rol } from "../../domain/entities";

// rolesDeUsuario delegates directly to the port.
export async function rolesDeUsuario(
  port: UsuariosRolesPort,
  usuarioId: string,
  signal?: AbortSignal,
): Promise<Rol[]> {
  return port.rolesDeUsuario(usuarioId, signal);
}
