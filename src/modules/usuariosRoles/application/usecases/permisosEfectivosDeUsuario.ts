import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Permiso } from "../../domain/entities";

// permisosEfectivosDeUsuario delegates directly to the port.
export async function permisosEfectivosDeUsuario(
  port: UsuariosRolesPort,
  usuarioId: string,
  signal?: AbortSignal,
): Promise<Permiso[]> {
  return port.permisosEfectivosDeUsuario(usuarioId, signal);
}
