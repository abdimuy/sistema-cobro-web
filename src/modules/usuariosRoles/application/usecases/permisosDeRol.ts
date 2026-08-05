import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Permiso } from "../../domain/entities";

// permisosDeRol delegates directly to the port.
export async function permisosDeRol(
  port: UsuariosRolesPort,
  rolId: string,
  signal?: AbortSignal,
): Promise<Permiso[]> {
  return port.permisosDeRol(rolId, signal);
}
