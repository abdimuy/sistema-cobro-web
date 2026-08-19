/**
 * El lenguaje de color de las fases de una venta, en un solo lugar.
 *
 * Vivía embebido en `VentaWorkflowTimeline`, y el anillo de la columna Fase se
 * inventaba el suyo: dos vocabularios para la misma idea. Ahora los dos leen de
 * aquí, así que cambiar el azul de "aprobada" es una edición, no dos.
 *
 * Son clases de Tailwind, no valores hex, para que las variantes de tema
 * (`dark:`) sigan saliendo del propio sistema de diseño y no haya que
 * duplicarlas en cada consumidor.
 */

/** Las cuatro fases del carril. Cancelada y eliminada no tienen color propio:
 *  salieron del carril y van en el atenuado del tema. */
export type FasePaletaKey = "borrador" | "revisada" | "aprobada" | "aplicada";

export interface FasePaleta {
  /** Círculo relleno (paso ya recorrido). */
  bg: string;
  /** Contorno + ícono + etiqueta del paso en curso. */
  fg: string;
  /** Borde del contorno del paso en curso. */
  border: string;
  /** Halo del paso en curso. */
  halo: string;
  /** Conector hacia este paso cuando ya se alcanzó. */
  rail: string;
  /** Rótulo en versalitas del panel de detalle. */
  caption: string;
  /**
   * Color de TEXTO para trazos de SVG.
   *
   * El anillo lo aplica al `<svg>` y pinta con `stroke="currentColor"`: así
   * hereda exactamente el mismo tono que el círculo relleno de la línea de
   * tiempo (`bg`), sin repetir el valor. Es el hue plano —500—, no la variante
   * 600/400 de `fg`, que existe para texto sobre fondo y se ve apagada como
   * trazo de 2.6 px.
   */
  trazo: string;
}

export const FASE_PALETA: Record<FasePaletaKey, FasePaleta> = {
  borrador: {
    bg: "bg-muted-foreground",
    fg: "text-foreground",
    border: "border-muted-foreground",
    halo: "ring-muted-foreground/15",
    rail: "bg-muted-foreground/70",
    caption: "text-foreground",
    trazo: "text-muted-foreground",
  },
  revisada: {
    bg: "bg-amber-500",
    fg: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500 dark:border-amber-400",
    halo: "ring-amber-500/15",
    rail: "bg-amber-500/70",
    caption: "text-amber-700 dark:text-amber-400",
    trazo: "text-amber-500",
  },
  aprobada: {
    bg: "bg-sky-500",
    fg: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500 dark:border-sky-400",
    halo: "ring-sky-500/15",
    rail: "bg-sky-500/70",
    caption: "text-sky-700 dark:text-sky-400",
    trazo: "text-sky-500",
  },
  aplicada: {
    bg: "bg-emerald-500",
    fg: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500 dark:border-emerald-400",
    halo: "ring-emerald-500/15",
    rail: "bg-emerald-500/70",
    caption: "text-emerald-700 dark:text-emerald-400",
    trazo: "text-emerald-500",
  },
};

/** Fuera del carril (cancelada / eliminada) no hay fase que colorear. */
export const TRAZO_FUERA_DEL_CARRIL = "text-muted-foreground";

/** `true` si la fase tiene color propio en la paleta. */
export function esFaseDelCarril(kind: string): kind is FasePaletaKey {
  return kind in FASE_PALETA;
}

/**
 * La clase de color de TEXTO de una fase — la que pinta el aro y la cifra.
 *
 * Existe para que no puedan separarse: el anillo la aplica al `<svg>` y la
 * celda al número que va al lado. Si salieran de dos sitios, una fase podría
 * terminar con el aro de un tono y la cifra de otro.
 *
 * DETENIDA no entra en la decisión: no es una fase, es una condición, y se
 * señala con forma (la pista punteada) y con peso. El color pertenece a la
 * fase.
 */
export function trazoDeFase(fase: { kind: string; enCarril: boolean }): string {
  if (!fase.enCarril) return TRAZO_FUERA_DEL_CARRIL;
  if (esFaseDelCarril(fase.kind)) return FASE_PALETA[fase.kind].trazo;
  return TRAZO_FUERA_DEL_CARRIL;
}
