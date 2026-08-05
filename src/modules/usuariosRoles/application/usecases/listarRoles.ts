import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Rol } from "../../domain/entities";

// listarRoles delegates directly to the port.
export async function listarRoles(
  port: UsuariosRolesPort,
  signal?: AbortSignal,
): Promise<Rol[]> {
  return port.listarRoles(signal);
}
