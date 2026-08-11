// UsuarioResponseDTO matches the backend's usuario JSON shape (mirrors Go
// dto.go). snake_case to match backend JSON.
export interface UsuarioResponseDTO {
  id: string;
  // Vacío/null/ausente para usuarios de MSP_USUARIOS sin vínculo a Firebase Auth.
  firebase_uid?: string | null;
  email: string;
  nombre: string;
  telefono?: string | null;
  almacen_id?: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// RolResponseDTO matches the backend's rol JSON shape.
export interface RolResponseDTO {
  id: string;
  nombre: string;
  description?: string | null;
  inmutable: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// PermisoResponseDTO matches the backend's permiso JSON shape. Permisos are
// catalog entries — no id, `codigo` is the natural key (e.g. "usuarios:ver").
export interface PermisoResponseDTO {
  codigo: string;
  description: string;
  categoria: string;
}

// ListResponseDTO is the generic paginated envelope every list endpoint
// returns. `next_cursor` is omitted (omitempty on the Go side) on the last
// page.
export interface ListResponseDTO<T> {
  items: T[];
  next_cursor?: string;
}

// AsignarRolBodyDTO is the POST /usuarios/{id}/roles body.
export interface AsignarRolBodyDTO {
  rol_id: string;
}

// AsignarPermisoBodyDTO is the POST /roles/{id}/permisos body.
export interface AsignarPermisoBodyDTO {
  codigo: string;
}

// CrearRolBodyDTO is the POST /roles body. `description` is omitted
// entirely when the caller didn't set one; sent explicitly (including
// `null`) when the caller did.
export interface CrearRolBodyDTO {
  nombre: string;
  description?: string | null;
}

// ActualizarRolBodyDTO is the PATCH /roles/{id} body. Same omit-vs-null
// discipline as CrearRolBodyDTO.
export interface ActualizarRolBodyDTO {
  nombre: string;
  description?: string | null;
}
