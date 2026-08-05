import type { CategoriaPermisos, Permiso } from "./entities";

// agruparPermisosPorCategoria groups permisos by `categoria` for display
// (usuario panel's effective-permisos list, rol panel's checklist).
// Categorías are ordered alphabetically (not by first appearance) so the
// result is deterministic regardless of input order; permisos within each
// categoría are ordered by `codigo`.
export function agruparPermisosPorCategoria(permisos: Permiso[]): CategoriaPermisos[] {
  const porCategoria = new Map<string, Permiso[]>();

  for (const permiso of permisos) {
    const existentes = porCategoria.get(permiso.categoria);
    if (existentes) {
      existentes.push(permiso);
    } else {
      porCategoria.set(permiso.categoria, [permiso]);
    }
  }

  return Array.from(porCategoria.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categoria, permisosDeCategoria]) => ({
      categoria,
      permisos: [...permisosDeCategoria].sort((a, b) => a.codigo.localeCompare(b.codigo)),
    }));
}

// unionEfectivaPermisos flattens N roles' permiso lists into the deduped
// effective union a usuario ends up with (dedupe by `codigo`, keeping the
// first occurrence's object), returned sorted by `codigo`.
export function unionEfectivaPermisos(permisosPorRol: Permiso[][]): Permiso[] {
  const porCodigo = new Map<string, Permiso>();

  for (const permisosDeRol of permisosPorRol) {
    for (const permiso of permisosDeRol) {
      if (!porCodigo.has(permiso.codigo)) {
        porCodigo.set(permiso.codigo, permiso);
      }
    }
  }

  return Array.from(porCodigo.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}
