import type { CrearUsuarioInput } from "../../application/ports/UserPort";
import type { CrearUsuarioBodyDTO } from "../http/dtos";

// domainToCrearUsuarioBody traduce el input del dominio al cuerpo del wire.
// `telefono` se OMITE cuando viene vacío, null o sólo espacios: el formulario
// deja el campo vacío con frecuencia y mandar "" haría fallar la validación
// del API (422) por un dato que nunca fue obligatorio.
export function domainToCrearUsuarioBody(
  input: CrearUsuarioInput,
): CrearUsuarioBodyDTO {
  const body: CrearUsuarioBodyDTO = {
    firebase_uid: input.firebaseUid,
    email: input.email,
    nombre: input.nombre,
  };

  const telefono = input.telefono?.trim();
  if (telefono) {
    body.telefono = telefono;
  }

  return body;
}
