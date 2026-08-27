import type { Usuario } from "../../domain/entities";

// CrearUsuarioInput lleva lo que el API necesita para registrar el alta en
// MSP_USUARIOS. `firebaseUid` es el uid que devolvió Firebase Auth (no el del
// admin que opera la pantalla) y `nombre` es el nombre real tecleado, no el
// correo. `telefono` es opcional: omitirlo significa "sin teléfono" — el
// mapper decide la semántica omit-vs-null contra el cuerpo del wire (ver
// domainToCrearUsuarioBody.ts).
export interface CrearUsuarioInput {
  firebaseUid: string;
  email: string;
  nombre: string;
  telefono?: string | null;
}

// UserPort es la interfaz de salida que el módulo user requiere de su host.
// El adaptador HTTP la satisface en producción; un fake en memoria la
// satisface en las pruebas.
export interface UserPort {
  crearUsuario(input: CrearUsuarioInput, signal?: AbortSignal): Promise<Usuario>;
}
