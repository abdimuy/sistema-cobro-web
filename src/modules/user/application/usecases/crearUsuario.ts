import type { CrearUsuarioInput, UserPort } from "../ports/UserPort";
import type { Usuario } from "../../domain/entities";

// crearUsuario delega directamente en el puerto.
export async function crearUsuario(
  port: UserPort,
  input: CrearUsuarioInput,
  signal?: AbortSignal,
): Promise<Usuario> {
  return port.crearUsuario(input, signal);
}
