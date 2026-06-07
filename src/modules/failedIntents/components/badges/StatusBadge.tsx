import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IntentStatus, IntentStatusValue } from "../../domain/values";

// Each status maps to a distinct color so the operator can scan a long
// list and grok state at a glance. Colors mirror the operator mental
// model:
//   • new            → red    (something needs attention)
//   • retried_ok     → green  (auto-recovered)
//   • retried_fail   → orange (auto-attempted, failed)
//   • ignored        → muted  (deliberately set aside)
//   • resolved_manual → blue  (operator resolved out-of-band)
const VARIANT_BY_STATUS: Record<
  IntentStatusValue,
  { label: string; className: string }
> = {
  new: {
    label: "Nuevo",
    className:
      "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 dark:bg-red-500/15",
  },
  retried_ok: {
    label: "Reintentado OK",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/15",
  },
  retried_fail: {
    label: "Reintentado falló",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300 dark:bg-orange-500/15",
  },
  ignored: {
    label: "Ignorado",
    className:
      "border-zinc-300/40 bg-zinc-200/40 text-zinc-600 dark:bg-zinc-700/40 dark:text-zinc-300",
  },
  resolved_manual: {
    label: "Resuelto",
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
