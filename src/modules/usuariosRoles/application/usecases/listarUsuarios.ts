import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Usuario } from "../../domain/entities";

// listarUsuarios delegates directly to the port.
export async function listarUsuarios(
  port: UsuariosRolesPort,
  signal?: AbortSignal,
): Promise<Usuario[]> {
  return port.listarUsuarios(signal);
}
