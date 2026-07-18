import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EstadoBucket } from "./lib/estadoBucket";

export type ConfigFiltro = {
  key: EstadoBucket;
  label: string;
  count: number;
};

interface Props {
  search: string;
  onSearch: (value: string) => void;
  filtros: ReadonlyArray<ConfigFiltro>;
  filtroActivo: EstadoBucket;
  onFiltro: (key: EstadoBucket) => void;
  total: number;
  searchPlaceholder?: string;
}

// ConfigToolbar is the shared top bar for both Configuración worklists: a
// client-side search box (accent-insensitive matching happens in the
// screen) plus a segmented status filter with live counts, and the current
// filtered total. Both screens wire the same shape so the two lists read as
// one visual language.
export function ConfigToolbar({
  search,
  onSearch,
  filtros,
  filtroActivo,
  onFiltro,
  total,
  searchPlaceholder,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder ?? "Buscar…"}
          aria-label="Buscar"
          className="h-8 pl-8 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/20 p-0.5">
          {filtros.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filtroActivo === f.key}
              onClick={() => onFiltro(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
                filtroActivo === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="tabular-nums text-muted-foreground/70">{f.count}</span>
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {total} resultado{total !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
