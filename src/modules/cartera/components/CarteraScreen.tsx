import { useState } from "react";
import { useSaludCartera } from "../presentation/hooks/useSaludCartera";
import CarteraFilters from "./CarteraFilters";

// CarteraScreen is the orchestrator for the cartera module.
// It owns filter state and delegates data fetching to hooks.
// Charts, tables, and KPI cards will be added in subsequent sprints.
export function CarteraScreen() {
  const [zona, setZona] = useState<string | undefined>(undefined);
  const [cobrador, setCobrador] = useState<string | undefined>(undefined);
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);

  const { isLoading, error } = useSaludCartera({ zona, cobrador, periodo });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          Cartera
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Salud del portafolio de crédito
        </p>
      </div>

      {/* Filters */}
      <CarteraFilters
        zona={zona}
        cobrador={cobrador}
        periodo={periodo}
        zonaOptions={[]}
        cobradorOptions={[]}
        onZonaChange={setZona}
        onCobradorChange={setCobrador}
        onPeriodoChange={setPeriodo}
      />

      {/* Error */}
      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          {error.message}
        </p>
      )}

      {/* Empty state placeholder */}
      {!isLoading && !error && (
        <div className="text-muted-foreground font-mono text-xs">
          Próximamente: KPIs de cartera
        </div>
      )}
    </div>
  );
}
