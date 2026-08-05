// Permiso is a single grantable permission code (e.g. "usuarios:ver"),
// grouped by `categoria` for display in the roles/usuarios UI.
export interface Permiso {
  codigo: string;
  description: string;
  categoria: string;
}

// CategoriaPermisos groups permisos under their shared `categoria`, used to
// render checklists/panels without repeating the grouping logic per screen.
// See `agruparPermisosPorCategoria`.
export interface CategoriaPermisos {
  categoria: string;
  permisos: Permiso[];
}
