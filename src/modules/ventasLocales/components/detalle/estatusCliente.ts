export interface EstatusClienteInfo {
  label: string;
  tone: "verde" | "gris" | "rojo" | "rojoOscuro";
  pillClass: string;
}

const ESTATUS_MAP: Record<string, EstatusClienteInfo> = {
  A: { label: "Activo", tone: "verde", pillClass: "bg-emerald-500/15 text-emerald-700" },
  B: { label: "Baja", tone: "gris", pillClass: "bg-muted-foreground/15 text-muted-foreground" },
  V: { label: "Vetado", tone: "rojo", pillClass: "bg-red-500/15 text-red-700" },
  C: { label: "Cancelado", tone: "rojoOscuro", pillClass: "bg-rose-800/15 text-rose-800" },
};

export function estatusClienteInfo(
  estatus: string | null | undefined
): EstatusClienteInfo | null {
  if (estatus == null) return null;
  const normalized = estatus.trim().toUpperCase();
  return ESTATUS_MAP[normalized] ?? null;
}
