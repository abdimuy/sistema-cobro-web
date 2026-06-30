import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

// slugifyNombre turns a client name into a filename-safe token: strips accents,
// collapses any run of non-alphanumerics to a single underscore, trims the ends
// and caps the length. Falls back to "cliente" when nothing usable remains.
export function slugifyNombre(nombre: string): string {
  const slug = nombre
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return slug || "cliente";
}

// nombreArchivoReporte builds the suggested filename for the Save-as dialog,
// e.g. Reporte_Minerva_Lopez_Merino_2026-06-30.pdf. fecha is passed in (caller
// formats it) so this stays pure and testable.
export function nombreArchivoReporte(nombreCliente: string, fecha: string): string {
  return `Reporte_${slugifyNombre(nombreCliente)}_${fecha}.pdf`;
}

// imprimirReporte triggers the print dialog for the embedded PDF. On WebView2
// (Windows) the iframe hosts Edge's PDF viewer, whose contentWindow.print()
// opens the native Windows print dialog.
export function imprimirReporte(iframeEl: HTMLIFrameElement | null): void {
  iframeEl?.contentWindow?.print();
}

// guardarReporte opens the native "Guardar como" dialog and writes the PDF bytes
// to the path the user chooses. Returns the chosen path, or null when the user
// cancels the dialog. Real write failures throw.
export async function guardarReporte(
  blob: Blob,
  nombreCliente: string,
  fecha: string,
): Promise<string | null> {
  const path = await save({
    defaultPath: nombreArchivoReporte(nombreCliente, fecha),
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!path) return null;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await writeFile(path, bytes);
  return path;
}
