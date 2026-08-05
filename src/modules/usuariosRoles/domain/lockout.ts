import type { Rol } from "./entities/Rol";
import type { Usuario } from "./entities/Usuario";

// noPuedeQuitarseSuPropioRolInmutable returns TRUE when the UI must BLOCK
// removing `rol` from `usuario`: the currently signed-in usuario would be
// stripping their own immutable rol (e.g. super_admin), which could lock
// everyone out of the admin tool. Matching is by `firebaseUid`, not `id`.
export function noPuedeQuitarseSuPropioRolInmutable(
  currentFirebaseUid: string,
  usuario: Usuario,
  rol: Rol,
): boolean {
  if (currentFirebaseUid === "") {
    return false;
  }
  return currentFirebaseUid === usuario.firebaseUid && rol.inmutable;
}
