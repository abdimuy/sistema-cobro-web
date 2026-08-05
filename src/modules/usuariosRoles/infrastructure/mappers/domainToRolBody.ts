import type {
  ActualizarRolInput,
  CrearRolInput,
} from "../../application/ports/UsuariosRolesPort";
import type { ActualizarRolBodyDTO, CrearRolBodyDTO } from "../http/dtos";

// domainToRolBody builds the POST/PATCH body shared by crearRol and
// actualizarRol. `description` is included only when the caller set it (as
// a `string` or explicit `null`); `undefined` (the default when the caller
// doesn't touch it) is omitted entirely so the backend leaves it untouched.
export function domainToRolBody(
  input: CrearRolInput | ActualizarRolInput,
): CrearRolBodyDTO | ActualizarRolBodyDTO {
  const body: CrearRolBodyDTO = { nombre: input.nombre };
  if (input.description !== undefined) body.description = input.description;
  return body;
}
