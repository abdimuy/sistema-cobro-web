import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WinbackAttribution } from "../domain/entities";
import { formatPercent } from "./lib/format";

interface AttributionPanelProps {
  attribution: WinbackAttribution | null;
  isLoading: boolean;
}

// AttributionPanel shows A/B uplift metrics: treatment vs control conversion
// rates and the calculated uplift. Compact card designed to sit below filters.
const AttributionPanel: React.FC<AttributionPanelProps> = ({
  attribution,
  isLoading,
}) => {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
      <div className="mb-3">
        <h2 className="font-serif text-lg font-normal text-foreground">
          Atribución
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Tratamiento vs control
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-12 w-20" />
        </div>
      ) : attribution === null ? (
        <p className="font-mono text-[12px] text-muted-foreground">
          Sin datos de atribución
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-8">
          {/* Treatment */}
          <StatBlock
            label="Tratamiento"
            count={`${attribution.treatmentConvertidos}/${attribution.treatmentTotal}`}
            rate={formatPercent(attribution.tasaTreatment)}
          />

          {/* Control */}
          <StatBlock
            label="Control"
            count={`${attribution.controlConvertidos}/${attribution.controlTotal}`}
            rate={formatPercent(attribution.tasaControl)}
          />

          {/* Uplift — prominent */}
          <dl className="flex flex-col gap-0.5">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Uplift
            </dt>
            <dd className="font-serif tabular text-[28px] font-normal leading-none text-foreground">
              {formatUplift(attribution.uplift)}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUplift(raw: string): string {
  const n = Number(raw);
  const formatted = formatPercent(raw);
  if (Number.isFinite(n) && n > 0) return `+${formatted}`;
  return formatted;
}

interface StatBlockProps {
  label: string;
  count: string;
  rate: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ label, count, rate }) => (
  <dl className="flex flex-col gap-0.5">
    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="tabular font-mono text-[15px] font-medium text-foreground">
      {count}
    </dd>
    <dd className="tabular font-mono text-[12px] text-muted-foreground">
      {rate}
    </dd>
  </dl>
);

export default AttributionPanel;
