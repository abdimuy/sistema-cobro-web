// matrizAccion.ts — pure helper shared between MatrizRiesgoPropension and
// FichaNextBestAction. Encapsulates the riesgo × propensión quadrant logic so
// it lives in exactly one place.

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CellKey = "vender" | "reactivar" | "enganche" | "noExtender";

export interface CellDef {
  key: CellKey;
  /** Short label shown in the matrix grid cell (e.g. "Vender más"). */
  label: string;
  /** One-line description of the tactic (e.g. "subir línea de crédito"). */
  sublabel: string;
  /** Action headline for FichaNextBestAction (e.g. "Sube la línea y vende más"). */
  headline: string;
  /** Tailwind classes for the default (non-highlighted) state in the matrix. */
  base: string;
  /** Additional classes applied when this is the client's highlighted cell. */
  highlight: string;
  /** Tailwind color token used for the action card in FichaNextBestAction. */
  cardBorder: string;
  cardBg: string;
  chipText: string;
  chipBorder: string;
}

// ─── Cell definitions ──────────────────────────────────────────────────────────

export const CELLS: Record<CellKey, CellDef> = {
  vender: {
    key: "vender",
    label: "Vender más",
    sublabel: "subir línea de crédito",
    headline: "Sube la línea y vende más",
    base: "border-green-500/20 bg-green-500/5 text-green-700",
    highlight:
      "ring-2 ring-green-500 border-green-500/60 bg-green-500/15 text-green-800",
    cardBorder: "border-green-500/40",
    cardBg: "bg-green-500/6",
    chipText: "text-green-700 dark:text-green-400",
    chipBorder: "border-green-500/50",
  },
  reactivar: {
    key: "reactivar",
    label: "Reactivar",
    sublabel: "campaña de reactivación",
    headline: "Reactiva al cliente",
    base: "border-blue-500/20 bg-blue-500/5 text-blue-700",
    highlight:
      "ring-2 ring-blue-500 border-blue-500/60 bg-blue-500/15 text-blue-800",
    cardBorder: "border-blue-500/40",
    cardBg: "bg-blue-500/6",
    chipText: "text-blue-700 dark:text-blue-400",
    chipBorder: "border-blue-500/50",
  },
  enganche: {
    key: "enganche",
    label: "Vender con enganche",
    sublabel: "crédito condicionado",
    headline: "Vende con enganche",
    base: "border-amber-500/20 bg-amber-500/5 text-amber-700",
    highlight:
      "ring-2 ring-amber-500 border-amber-500/60 bg-amber-500/15 text-amber-800",
    cardBorder: "border-amber-500/40",
    cardBg: "bg-amber-500/6",
    chipText: "text-amber-700 dark:text-amber-400",
    chipBorder: "border-amber-500/50",
  },
  noExtender: {
    key: "noExtender",
    label: "No extender",
    sublabel: "priorizar cobranza",
    headline: "Prioriza la cobranza",
    base: "border-red-500/20 bg-red-500/5 text-red-700",
    highlight:
      "ring-2 ring-red-500 border-red-500/60 bg-red-500/15 text-red-800",
    cardBorder: "border-red-500/40",
    cardBg: "bg-red-500/6",
    chipText: "text-red-700 dark:text-red-400",
    chipBorder: "border-red-500/50",
  },
};

// ─── Pure quadrant resolver ────────────────────────────────────────────────────

/**
 * resolveCell — maps (bandaCredito, bandaRecompra) to a CellKey.
 *
 * Matrix:
 *
 *                  Alta propensión   Baja propensión
 *  Bajo riesgo     vender            reactivar
 *  Alto riesgo     enganche          noExtender
 *
 * "Bajo riesgo" = bandaCredito in {BAJO, MEDIO}
 * "Alta propensión" = bandaRecompra === "ALTA"
 */
export function resolveCell(
  bandaCredito: string,
  bandaRecompra: string,
): CellKey {
  const esBajoRiesgo =
    bandaCredito === "BAJO" || bandaCredito === "MEDIO";
  const esAltaPropension = bandaRecompra === "ALTA";

  if (esBajoRiesgo && esAltaPropension) return "vender";
  if (esBajoRiesgo && !esAltaPropension) return "reactivar";
  if (!esBajoRiesgo && esAltaPropension) return "enganche";
  return "noExtender";
}
