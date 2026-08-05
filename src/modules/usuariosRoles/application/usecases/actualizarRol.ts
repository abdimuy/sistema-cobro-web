import type {
  ActualizarRolInput,
  UsuariosRolesPort,
} from "../ports/UsuariosRolesPort";
import type { Rol } from "../../domain/entities";

// actualizarRol delegates directly to the port.
export async function actualizarRol(
  port: UsuariosRolesPort,
  rolId: string,
  input: ActualizarRolInput,
  signal?: AbortSignal,
): Promise<Rol> {
  return port.actualizarRol(rolId, input, signal);
}
