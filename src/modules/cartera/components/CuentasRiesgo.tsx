import { useState } from "react";
import { Link } from "react-router-dom";
import type { CuentaRiesgo } from "../domain/entities";
import { sortCuentasRiesgo, filterCuentasPorTier, type CuentaSortKey, type SortDir } from "./lib/tableOps";
import { formatMoney } from "./lib/format";
import TierRiesgoBadge from "./badges/TierRiesgoBadge";
import EstadoPagoBadge from "@/modules/winback/components/badges/EstadoPagoBadge";
import SegmentoBadge from "@/modules/winback/components/badges/SegmentoBadge";
import { cn } from "@/lib/utils";

// CuentasRiesgo is portfolio-wide (v1): filtering is local only.
// Not connected to the global filter bar — by design, not a bug.

const TIER_OPTIONS = ["AL_DIA", "VIGILANCIA", "EN_RIESGO", "CRITICO"] as const;
const TIER_LABELS: Record<string, string> = { AL_DIA: "Al día", VIGILANCIA: "Vigilancia", EN_RIESGO: "En riesgo", CRITICO: "Crítico" };

type SortableCol = { key: CuentaSortKey | null; label: string };
const COLUMNS: SortableCol[] = [
  { key: null, label: "Cliente" },
  { key: null, label: "Zona" },
  { key: null, label: "Riesgo" },
  { key: null, label: "Estado" },
  { key: "saldo", label: "Saldo" },
  { key: "diasAtrasoProm", label: "Días atraso" },
  { key: "fechaProxPago", label: "Próximo pago" },
];

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-MX");
}

export function CuentasRiesgo({
  cuentas,
  isLoading = false,
}: {
  cuentas: CuentaRiesgo[];
  isLoading?: boolean;
}) {
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<CuentaSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleHeaderClick(key: CuentaSortKey | null) {
    if (!key) return;
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = filterCuentasPorTier(cuentas, tierFilter);
  const sorted = sortCuentasRiesgo(filtered, sortKey, sortDir);

  if (cuentas.length === 0 && !isLoading) {
    return <p className="font-mono text-[11px] text-muted-foreground">Sin cuentas en riesgo</p>;
  }

  return (
    <div className={cn("space-y-3", isLoading && "opacity-50 transition-opacity")}>
      {/* Local tier filter */}
      <div className="flex items-center gap-2">
        <select
          className="font-mono text-xs border border-border/40 rounded px-2 py-1 bg-background text-foreground"
          value={tierFilter ?? ""}
          onChange={(e) => setTierFilter(e.target.value || null)}
        >
          <option value="">Todos</option>
          {TIER_OPTIONS.map((t) => (
            <option key={t} value={t}>{TIER_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
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
            {sorted.map((c) => (
              <tr key={c.clienteId} className="border-b border-border/20 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link
                    to={`/clientes/${c.clienteId}`}
                    className="font-mono text-xs hover:underline text-foreground"
                  >
                    {c.nombre}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.zona}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <TierRiesgoBadge value={c.tierRiesgo} />
                    <SegmentoBadge value={c.segmento} />
                  </div>
                </td>
                <td className="px-3 py-2"><EstadoPagoBadge value={c.estadoPago} /></td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{formatMoney(c.saldo)}</td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{c.diasAtrasoProm}</td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums">{formatDate(c.fechaProxPago)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
