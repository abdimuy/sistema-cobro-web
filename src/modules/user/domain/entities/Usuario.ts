// Usuario es la fila de MSP_USUARIOS que el API devuelve al dar de alta a una
// persona. El alta completa toca tres sistemas —Firebase Auth, Firestore y el
// API— y este es el resultado del tercero: sin él, el usuario existe para el
// login pero no para el API, y no aparece en Vendedores ni en Usuarios y roles.
//
// `telefono` y `almacenId` son opcionales en el alta: el API los devuelve como
// null cuando no se enviaron, y aquí se normalizan a null.
export interface Usuario {
  id: string;
  firebaseUid: string;
  email: string;
  nombre: string;
  telefono: string | null;
  almacenId: number | null;
  activo: boolean;
}
