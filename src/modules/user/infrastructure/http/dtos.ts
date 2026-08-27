// UsuarioResponseDTO matches the backend's usuario JSON shape (mirrors Go
// dto.go). snake_case to match backend JSON.
export interface UsuarioResponseDTO {
  id: string;
  firebase_uid?: string | null;
  email: string;
  nombre: string;
  telefono?: string | null;
  almacen_id?: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// CrearUsuarioBodyDTO is the POST /usuarios body. `telefono` is omitted
// entirely when the form left it empty; sent only when it carries content.
export interface CrearUsuarioBodyDTO {
  firebase_uid: string;
  email: string;
  nombre: string;
  telefono?: string;
}
