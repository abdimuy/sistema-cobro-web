import { useState } from "react";
import { ChevronDown, ChevronRight, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Correction } from "../../infrastructure/mappers/crearVentaBodyToVentaV2WithCorrections";

// AuditTrailBanner surfaces every silent sanitization the bootstrap
// mapper applied to the captured body, so the operator can tell apart
// "the backend rejected this field" from "the form auto-rewrote this
// field before I could see it". Collapsed by default — the count is
// in the header, the details are one click away.
//
// Each row is (path) (before → after) (reason). Values are JSON-
// stringified so an empty string vs null vs missing is unambiguous.

export type AuditTrailBannerProps = {
  corrections: ReadonlyArray<Correction>;
};

export function AuditTrailBanner({ corrections }: AuditTrailBannerProps) {
  const [open, setOpen] = useState(false);
  if (corrections.length === 0) return null;

  const count = corrections.length;
  const label = count === 1 ? "1 auto-corrección" : `${count} auto-correcciones`;

  return (
    <div
      data-testid="audit-trail-banner"
      className="border-b border-amber-300 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="audit-trail-banner-toggle"
        className="w-full px-6 py-2.5 flex items-center gap-2 text-left hover:bg-amber-100/40 dark:hover:bg-amber-900/20 transition-colors"
      >
        <Wand2 className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
        <span className="text-[12px] font-medium text-amber-900 dark:text-amber-100">
          {label}
        </span>
        <span className="text-[11px] text-amber-700/80 dark:text-amber-300/70 truncate">
          aplicadas al body antes de cargar el formulario
        </span>
        <span className="ml-auto inline-flex items-center text-amber-700 dark:text-amber-300">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
      {open && (
        <ul
          data-testid="audit-trail-banner-list"
          className="px-6 pb-3 pt-1 space-y-1.5"
        >
          {corrections.map((c, i) => (
            <li
              key={`${c.path}:${i}`}
              data-testid={`audit-trail-row-${i}`}
              className={cn(
                "rounded-md px-3 py-2 bg-white/60 dark:bg-zinc-900/40",
                "border border-amber-200/70 dark:border-amber-900/40",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <code className="font-mono text-[11px] text-amber-900 dark:text-amber-200">
                  {c.path}
                </code>
                <span className="text-[11px] text-zinc-500">
                  <span className="font-mono">{formatValue(c.before)}</span>
                  <span className="mx-1">→</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">
                    {formatValue(c.after)}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                {c.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
