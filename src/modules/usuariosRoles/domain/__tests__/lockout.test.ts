import { describe, expect, it } from "vitest";
import { noPuedeQuitarseSuPropioRolInmutable } from "../lockout";
import type { Rol } from "../entities/Rol";
import type { Usuario } from "../entities/Usuario";

const USUARIO_BRENDA: Usuario = {
  id: "usr-001",
  firebaseUid: "fb-brenda-001",
  email: "brenda.sanchez@muebleriamsp.mx",
  nombre: "Brenda Guadalupe Sánchez Ruiz",
  activo: true,
};
const USUARIO_RODRIGO: Usuario = {
  id: "usr-002",
  firebaseUid: "fb-rodrigo-002",
  email: "rodrigo.pineda@muebleriamsp.mx",
  nombre: "Rodrigo Pineda Alvarado",
  activo: true,
};
const ROL_SUPER_ADMIN: Rol = {
  id: "rol-001",
  nombre: "super_admin",
  description: "Acceso total al sistema",
  inmutable: true,
  activo: true,
};
const ROL_COBRADOR: Rol = {
  id: "rol-002",
  nombre: "cobrador",
  description: "Cobranza en campo",
  inmutable: false,
  activo: true,
};

describe("noPuedeQuitarseSuPropioRolInmutable", () => {
  it.each<{
    nombre: string;
    currentFirebaseUid: string;
    usuario: Usuario;
    rol: Rol;
    esperado: boolean;
  }>([
    {
      nombre: "propio usuario + rol inmutable -> true (bloquea)",
      currentFirebaseUid: USUARIO_BRENDA.firebaseUid,
      usuario: USUARIO_BRENDA,
      rol: ROL_SUPER_ADMIN,
      esperado: true,
    },
    {
      nombre: "propio usuario + rol mutable -> false (permite)",
      currentFirebaseUid: USUARIO_BRENDA.firebaseUid,
      usuario: USUARIO_BRENDA,
      rol: ROL_COBRADOR,
      esperado: false,
    },
    {
      nombre: "otro usuario + rol inmutable -> false (permite)",
      currentFirebaseUid: USUARIO_BRENDA.firebaseUid,
      usuario: USUARIO_RODRIGO,
      rol: ROL_SUPER_ADMIN,
      esperado: false,
    },
    {
      nombre: "otro usuario + rol mutable -> false (permite)",
      currentFirebaseUid: USUARIO_BRENDA.firebaseUid,
      usuario: USUARIO_RODRIGO,
      rol: ROL_COBRADOR,
      esperado: false,
    },
    {
      nombre: "currentFirebaseUid vacío -> false, incluso si coincidiera con un firebaseUid vacío",
      currentFirebaseUid: "",
      usuario: { ...USUARIO_BRENDA, firebaseUid: "" },
      rol: ROL_SUPER_ADMIN,
      esperado: false,
    },
    {
      nombre: "match por firebaseUid, no por id: mismo firebaseUid con id distinto SÍ bloquea",
      currentFirebaseUid: USUARIO_BRENDA.firebaseUid,
      usuario: { ...USUARIO_BRENDA, id: "usr-otro-id-999" },
      rol: ROL_SUPER_ADMIN,
      esperado: true,
    },
    {
      nombre: "match por firebaseUid, no por id: mismo id con firebaseUid distinto NO bloquea",
      currentFirebaseUid: USUARIO_BRENDA.firebaseUid,
      usuario: { ...USUARIO_BRENDA, id: USUARIO_BRENDA.id, firebaseUid: "fb-otro-uid-999" },
      rol: ROL_SUPER_ADMIN,
      esperado: false,
    },
  ])("$nombre", ({ currentFirebaseUid, usuario, rol, esperado }) => {
    expect(noPuedeQuitarseSuPropioRolInmutable(currentFirebaseUid, usuario, rol)).toBe(esperado);
  });
});
