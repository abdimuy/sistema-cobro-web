// Rol groups a set of permisos and can be assigned to one or more usuarios.
// `inmutable` marks system roles (e.g. super_admin) that cannot be deleted
// or renamed, and whose removal from the current usuario must be blocked in
// the UI to avoid locking every admin out of the tool — see
// `noPuedeQuitarseSuPropioRolInmutable`.
export interface Rol {
  id: string;
  nombre: string;
  description: string | null;
  inmutable: boolean;
  activo: boolean;
}
