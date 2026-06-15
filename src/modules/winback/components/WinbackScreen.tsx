import { useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SegmentoValue } from "../domain/values";
import type { WinbackItem } from "../domain/entities";
import { useListarWinback } from "../presentation/hooks/useListarWinback";
import { useAttribution } from "../presentation/hooks/useAttribution";
import { useRefrescarWinback } from "../presentation/hooks/useRefrescarWinback";
import WinbackFilters from "./WinbackFilters";
import WinbackTable from "./WinbackTable";
import WinbackDetailDrawer from "./WinbackDetailDrawer";
import AttributionPanel from "./AttributionPanel";

const DEFAULT_LIMIT = 50;

// WinbackScreen is the orchestrator for the winback module. It owns:
//   • Filter state (segmento, zona, incluirActivos).
//   • Selected-item state for the detail drawer.
//   • The refresh action and its toast feedback.
//
// All data fetching is delegated to hooks that read the port from context.
// Only WinbackContainer (the composition root) touches infrastructure.
export function WinbackScreen() {
  // ── Filter state ───────────────────────────────────────────────────────────
  const [segmento, setSegmento] = useState<SegmentoValue | undefined>(
    undefined,
  );
  const [zona, setZona] = useState<string | undefined>(undefined);
  const [incluirActivos, setIncluirActivos] = useState(false);

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { items, isLoading, error } = useListarWinback({
    segmento,
    zona,
    limit: DEFAULT_LIMIT,
    incluirActivos,
  });

  const { attribution, isLoading: attributionLoading, error: attributionError } = useAttribution({
    zona,
  });

  const {
    refrescar,
    isLoading: refrescando,
  } = useRefrescarWinback();

  // ── Derived zona options from loaded items ─────────────────────────────────
  const zonaOptionsRef = useRef<string[]>([]);
  const zonaOptions = useMemo(() => {
    if (zona === undefined) {
      const unique = Array.from(new Set(items.map((i) => i.zona))).sort();
      zonaOptionsRef.current = unique;
    }
    return zonaOptionsRef.current;
  }, [items, zona]);

  // ── Selected item for drawer ───────────────────────────────────────────────
  const [selected, setSelected] = useState<WinbackItem | null>(null);

  // ── Refresh handler ────────────────────────────────────────────────────────
  async function handleRefrescar() {
    const r = await refrescar(false);
    if (r?.estado === "iniciado") {
      toast.success("Refresco iniciado");
    } else if (r?.estado === "ya_en_progreso") {
      toast.info("Ya en progreso");
    } else if (r === null) {
      toast.error("No se pudo refrescar");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          Winback
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Clientes con mayor potencial de recompra
        </p>
      </div>

      {/* Filters row + Refrescar button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <WinbackFilters
          segmento={segmento}
          zona={zona}
          incluirActivos={incluirActivos}
          zonaOptions={zonaOptions}
          onSegmentoChange={setSegmento}
          onZonaChange={setZona}
          onIncluirActivosChange={setIncluirActivos}
        />
        <Button
          variant="outline"
          onClick={() => void handleRefrescar()}
          disabled={refrescando}
          className="gap-1.5 shrink-0"
          data-testid="refrescar-button"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refrescando ? "animate-spin" : ""}`}
          />
          Refrescar
        </Button>
      </div>

      {/* Attribution panel */}
      <AttributionPanel attribution={attribution} isLoading={attributionLoading} />
      {/* Attribution-level error */}
      {attributionError && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          {attributionError.message}
        </p>
      )}

      {/* List-level error */}
      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          {error.message}
        </p>
      )}

      {/* Table */}
      <WinbackTable
        items={items}
        isLoading={isLoading}
        onRowClick={setSelected}
      />

      {/* Detail drawer — mounted once */}
      <WinbackDetailDrawer
        item={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
