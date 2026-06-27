import { useState } from "react";
import type { CobradorPerformance } from "../domain/entities";
import { sortCobradores, type CobradorSortKey, type SortDir } from "./lib/tableOps";
import { formatMoney, formatRatioPct } from "./lib/format";
import { ceiLevel, parLevel, semaphoreTone } from "./lib/carteraUx";
import { cn } from "@/lib/utils";

function SemDot({ tone }: { tone: { dot: string; text: string } }) {
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0 mr-1", tone.dot)} />;
}

function cobradorName(id: number): string {
  return id === 0 ? "Sin cobrador" : `Cobrador #${id}`;
}

const COLUMNS: { key: CobradorSortKey | null; label: string }[] = [
  { key: null, label: "Cobrador" },
  { key: "cei", label: "CEI" },
  { key: "par", label: "PAR" },
  { key: "pctCorriente", label: "Cobertura" },
  { key: "saldoTotal", label: "Saldo total" },
  { key: "cuentasTotal", label: "Cuentas" },
];

export function CobradorRanking({
  cobradores,
  isLoading = false,
}: {
  cobradores: CobradorPerformance[];
  isLoading?: boolean;
}) {
  const [sortKey, setSortKey] = useState<CobradorSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleHeaderClick(key: CobradorSortKey | null) {
    if (!key) return;
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = sortCobradores(cobradores, sortKey, sortDir);

  if (cobradores.length === 0) {
    return <p className="font-mono text-[11px] text-muted-foreground">Sin cobradores</p>;
  }

  return (
    <div className={cn("overflow-x-auto", isLoading && "opacity-50 transition-opacity")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                onClick={() => handleHeaderClick(col.key)}
                className={cn(
                  "px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground",
                  col.key && "cursor-pointer select-none hover:text-foreground",
                )}
              >
                {col.label}
                {col.key && sortKey === col.key && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const ceiTone = semaphoreTone(ceiLevel(c.cei));
            const parTone = semaphoreTone(parLevel(c.par));
            return (
              <tr key={c.cobradorId} className="border-b border-border/20 hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{cobradorName(c.cobradorId)}</td>
                <td className={cn("px-3 py-2 font-mono text-xs tabular-nums", ceiTone.text)}>
                  <SemDot tone={ceiTone} />
                  {formatRatioPct(c.cei)}
                </td>
                <td className={cn("px-3 py-2 font-mono text-xs tabular-nums", parTone.text)}>
                  <SemDot tone={parTone} />
                  {formatRatioPct(c.par)}
                </td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{formatRatioPct(c.pctCorriente)}</td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{formatMoney(c.saldoTotal)}</td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{c.cuentasTotal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
