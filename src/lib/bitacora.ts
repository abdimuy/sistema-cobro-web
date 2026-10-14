import { invoke } from "@tauri-apps/api/core";

export type NivelBitacora = "info" | "warn" | "error";

/**
 * Deja constancia de un evento del frontend en el archivo de log del
 * escritorio (tauri-plugin-log, carpeta de logs de la app), además de la
 * consola. Sirve para que una pantalla vacía, una recarga o un repintado
 * queden en disco y se puedan leer después, sin depender de tener el
 * inspector abierto en el momento.
 *
 * Nunca lanza: fuera de Tauri (navegador, pruebas) sólo escribe en consola.
 */
export function registrar(nivel: NivelBitacora, mensaje: string): void {
  const consola =
    nivel === "error" ? console.error : nivel === "warn" ? console.warn : console.info;
  consola(`[bitacora] ${mensaje}`);
  try {
    Promise.resolve(invoke("registrar_frontend", { nivel, mensaje })).catch(() => {});
  } catch {
    // Sin backend de Tauri: la consola ya lo tiene.
  }
}
