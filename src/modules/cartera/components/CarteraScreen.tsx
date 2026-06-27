import { useState } from "react";
import { Panel } from "@/modules/clientes/components/ficha/lib/Panel";
import { useSaludCartera } from "../presentation/hooks/useSaludCartera";
import { useAging } from "../presentation/hooks/useAging";
import { useRollRate } from "../presentation/hooks/useRollRate";
import CarteraFilters from "./CarteraFilters";
import { CarteraKpiHero } from "./CarteraKpiHero";
import { CarteraAging } from "./CarteraAging";
import { CarteraAlerts } from "./CarteraAlerts";
import { DeterioroChip } from "./DeterioroChip";

// CarteraScreen is the orchestrator for the cartera module. It owns filter
// state and composes the Resumen section: KPI hero, deterioration indicator,
// alerts band and aging distribution.
export function CarteraScreen() {
  const [zona, setZona] = useState<string | undefined>(undefined);
  const [cobrador, setCobrador] = useState<string | undefined>(undefined);
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);

  const filters = { zona, cobrador, periodo };
  const { salud, isLoading, error } = useSaludCartera(filters);
  const { buckets, isLoading: agingLoading } = useAging(filters);
  const { rollRate } = useRollRate(filters);

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

      {/* Resumen */}
      {!error && salud && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <CarteraAlerts salud={salud} />
            {rollRate && <DeterioroChip rollRate={rollRate} />}
          </div>

          <CarteraKpiHero salud={salud} isLoading={isLoading} />

          <Panel title="Antigüedad de saldos" subtitle="Saldo por bucket de mora">
            <CarteraAging buckets={buckets} isLoading={agingLoading} />
          </Panel>
        </div>
      )}
    </div>
  );
}
