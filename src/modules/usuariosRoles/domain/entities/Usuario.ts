// Usuario represents an app user that can hold one or more roles. It is a
// read-mostly projection of MSP_USUARIOS from the API's perspective — this
// module never creates usuarios, only reads them and manages their role
// assignments.
export interface Usuario {
  id: string;
  // "" cuando el usuario no está vinculado a Firebase Auth (alta por SQL o
  // aún sin invitar). El anti-lockout trata "" como "sin coincidencia".
  firebaseUid: string;
  email: string;
  nombre: string;
  activo: boolean;
}
