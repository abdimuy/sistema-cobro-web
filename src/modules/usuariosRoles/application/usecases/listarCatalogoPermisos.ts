import type { UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Permiso } from "../../domain/entities";

// listarCatalogoPermisos delegates directly to the port.
export async function listarCatalogoPermisos(
  port: UsuariosRolesPort,
  signal?: AbortSignal,
): Promise<Permiso[]> {
  return port.listarCatalogoPermisos(signal);
}
