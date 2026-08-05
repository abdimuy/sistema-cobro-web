import type { CrearRolInput, UsuariosRolesPort } from "../ports/UsuariosRolesPort";
import type { Rol } from "../../domain/entities";

// crearRol delegates directly to the port.
export async function crearRol(
  port: UsuariosRolesPort,
  input: CrearRolInput,
  signal?: AbortSignal,
): Promise<Rol> {
  return port.crearRol(input, signal);
}
