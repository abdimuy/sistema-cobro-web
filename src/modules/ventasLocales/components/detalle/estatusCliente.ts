export interface EstatusClienteInfo {
  label: string;
  tone: "verde" | "gris" | "rojo" | "rojoOscuro";
  pillClass: string;
}

const ESTATUS_MAP: Record<string, EstatusClienteInfo> = {
  A: { label: "Activo", tone: "verde", pillClass: "bg-emerald-500/15 text-emerald-700" },
  B: { label: "Baja", tone: "gris", pillClass: "bg-muted-foreground/15 text-muted-foreground" },
  V: {
    label: "Suspensión de ventas",
    tone: "rojo",
    pillClass: "bg-red-500/15 text-red-700",
  },
  C: {
    label: "Suspensión de créditos",
    tone: "rojoOscuro",
    pillClass: "bg-rose-800/15 text-rose-800",
  },
};

export function estatusClienteInfo(
  estatus: string | null | undefined
): EstatusClienteInfo | null {
  if (estatus == null) return null;
  const normalized = estatus.trim().toUpperCase();
  return ESTATUS_MAP[normalized] ?? null;
}

/**
 * Acompaña a la regla del API (`cliente_estatus_no_permite_venta`), que sólo
 * deja aplicar cuando el cliente está en A (Activo) o B (Baja).
 *
 * OJO: aquí la regla está escrita al revés que en el servidor, y es a
 * propósito. El API usa lista BLANCA — cualquier cosa que no sea A o B
 * bloquea. Esta función usa lista NEGRA — bloquea sólo V y C.
 *
 * La asimetría es deliberada: la UI falla ABIERTA, el API falla CERRADO. Un
 * estatus ausente (cliente nuevo, todavía sin cliente_id ligado) o un valor
 * que no conocemos NO deben apagar el botón aquí, porque romperían el flujo
 * de venta a cliente nuevo, que es normal y frecuente. El guard de verdad
 * vive en el servidor; esto es sólo una cortesía para no hacer un viaje en
 * balde.
 *
 * Por eso NO conviertas esto en `=== "A" || === "B"` para "igualarlo" al
 * API: eso desactivaría el botón en cada venta de cliente nuevo.
 */
export function permiteAplicar(estatus: string | null | undefined): boolean {
  if (!estatus) return true;
  const normalized = estatus.trim().toUpperCase();
  if (normalized === "") return true;
  return normalized !== "V" && normalized !== "C";
}
