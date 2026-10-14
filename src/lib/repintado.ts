import { listen } from "@tauri-apps/api/event";
import { registrar } from "@/lib/bitacora";

/**
 * Respaldo en JS del repintado tras el reposo.
 *
 * En macOS 26, WKWebView (wry 0.55) puede dejar de presentar cuadros tras el
 * reposo o un cambio de pantalla (tauri-apps/wry#1848): el DOM sigue vivo
 * pero la ventana muestra un cuadro viejo o sólo la capa difuminada. El
 * arreglo principal está en Rust (src-tauri/src/repintado.rs), que empuja al
 * WebView al despertar. Esto es la segunda red: si la ventana vuelve tras una
 * ausencia larga, o si Rust avisa que el equipo despertó, se fuerza un
 * repintado desde dentro de la página.
 */

/** Evento que emite el lado nativo al despertar o cambiar de pantalla. */
export const EVENTO_DESPERTAR_NATIVO = "ventana-despertar";

const AUSENCIA_MINIMA_MS = 60_000;

type DejarDeEscuchar = () => void;

interface Opciones {
  ausenciaMinimaMs?: number;
  ahora?: () => number;
  repintar?: () => void;
  escucharNativo?: (cb: (motivo: string) => void) => DejarDeEscuchar;
}

/**
 * Cambia la opacidad de la raíz por un cuadro (0.999, imperceptible) y la
 * restaura: obliga al motor a recomponer la página entera sin mover el layout.
 */
export function forzarRepintado(): void {
  const raiz = document.documentElement;
  const previa = raiz.style.opacity;
  raiz.style.opacity = "0.999";
  void raiz.offsetHeight; // fuerza el cálculo de estilo antes del siguiente cuadro
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      raiz.style.opacity = previa;
    }),
  );
}

function escucharDespertarNativo(cb: (motivo: string) => void): DejarDeEscuchar {
  let soltar: (() => void) | null = null;
  let cancelado = false;
  try {
    listen<string>(EVENTO_DESPERTAR_NATIVO, (e) => cb(String(e.payload ?? "")))
      .then((fn) => {
        if (cancelado) fn();
        else soltar = fn;
      })
      .catch(() => {});
  } catch {
    // Fuera de Tauri no hay eventos nativos; quedan visibilidad y foco.
  }
  return () => {
    cancelado = true;
    soltar?.();
  };
}

export function instalarRespaldoDeRepintado(opciones: Opciones = {}): () => void {
  const {
    ausenciaMinimaMs = AUSENCIA_MINIMA_MS,
    ahora = Date.now,
    repintar = forzarRepintado,
    escucharNativo = escucharDespertarNativo,
  } = opciones;

  let ausenteDesde: number | null = null;

  const marcarAusencia = () => {
    if (ausenteDesde === null) ausenteDesde = ahora();
  };
  const marcarRegreso = () => {
    if (ausenteDesde === null) return;
    const ausencia = ahora() - ausenteDesde;
    ausenteDesde = null;
    if (ausencia < ausenciaMinimaMs) return;
    registrar("info", `repintado js tras ${Math.round(ausencia / 1000)} s de ausencia`);
    repintar();
  };
  const alCambiarVisibilidad = () => {
    if (document.visibilityState === "hidden") marcarAusencia();
    else marcarRegreso();
  };

  document.addEventListener("visibilitychange", alCambiarVisibilidad);
  window.addEventListener("blur", marcarAusencia);
  window.addEventListener("focus", marcarRegreso);
  const dejarNativo = escucharNativo((motivo) => {
    registrar("info", `repintado js por aviso nativo: ${motivo}`);
    repintar();
  });

  return () => {
    document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    window.removeEventListener("blur", marcarAusencia);
    window.removeEventListener("focus", marcarRegreso);
    dejarNativo();
  };
}
