import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IntentStatus, IntentStatusValue } from "../../domain/values";

// Each status maps to a distinct color so the operator can scan a long
// list and grok state at a glance. Colors mirror the operator mental
// model:
//   • new             → el acento de la pantalla (pendiente, requiere acción)
//   • retried_ok      → green  (cerrado tras un replay exitoso)
//   • retried_fail    → orange (último replay falló — puede volver a intentarse)
//   • ignored         → muted  (cerrado intencionalmente sin reintento)
//   • resolved_manual → blue   (operador lo resolvió por fuera del sistema)
//
// Naming convention: the badge labels are SHORT for the table row; the
// long-form descriptions live in the console's filter chips ("Resueltos por
// reintento", etc.). The badges still start with "Resuelto" for the two
// closed-OK states so a quick scan groups them visually.
const VARIANT_BY_STATUS: Record<
  IntentStatusValue,
  { label: string; className: string }
> = {
  new: {
    // Pendiente usa el ACENTO de la pantalla (`destructive`), no un rojo
    // suelto: es el mismo color de la barra de la tarjeta y del veredicto del
    // encabezado, y que sean el mismo es lo que hace que "esto necesita a una
    // persona" se lea como una sola idea y no como tres avisos distintos.
    label: "Pendiente",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  retried_ok: {
    label: "Resuelto auto",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/15",
  },
  retried_fail: {
    label: "Reintento fallido",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300 dark:bg-orange-500/15",
  },
  ignored: {
    label: "Ignorado",
    className: "border-border bg-muted text-muted-foreground",
  },
  resolved_manual: {
    label: "Resuelto manual",
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 dark:bg-blue-500/15",
  },
};

export function StatusBadge({ status }: { status: IntentStatus }) {
  const v = VARIANT_BY_STATUS[status.value];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-[11px] uppercase tracking-wide",
        v.className,
      )}
    >
      {v.label}
    </Badge>
  );
}
