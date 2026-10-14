// Preferencias por computadora (vista de la línea, columnas, vistas guardadas).
// localStorage puede no existir o lanzar (ventana privada, datos bloqueados):
// todo acceso va en try/catch y la pantalla funciona igual sin él.

export function leerLocal<T>(
  clave: string,
  defecto: T,
  valido: (v: unknown) => v is T,
): T {
  try {
    const crudo = window.localStorage.getItem(clave);
    if (crudo === null) return defecto;
    const valor: unknown = JSON.parse(crudo);
    return valido(valor) ? valor : defecto;
  } catch {
    return defecto;
  }
}

export function escribirLocal(clave: string, valor: unknown): void {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento: la preferencia vive solo en memoria esta sesión.
  }
}
