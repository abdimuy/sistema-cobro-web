import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";

export function ArchivoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200",
        className,
      )}
    >
      <Archive aria-hidden="true" className="h-3 w-3" />
      Archivo
    </span>
  );
}
