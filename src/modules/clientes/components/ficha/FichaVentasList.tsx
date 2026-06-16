import dayjs from "dayjs";
import "dayjs/locale/es";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "../lib/format";
import type { VentaCliente } from "../../domain/entities/VentaCliente";
import type { DomainError } from "../../domain/errors";

dayjs.locale("es");

// ---------------------------------------------------------------------------
// Tipo badge
// ---------------------------------------------------------------------------

function TipoBadge({ tipo }: { tipo: string }) {
  const isCredito = tipo === "CREDITO";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        isCredito
          ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
          : "border-border/60 bg-muted/40 text-muted-foreground",
      )}
    >
      {isCredito ? "Crédito" : "Contado"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

interface RowProps {
  venta: VentaCliente;
  onClick: (id: number) => void;
}

function VentaRow({ venta, onClick }: RowProps) {
  const fecha = dayjs(venta.fecha).format("DD MMM YYYY");

  return (
    <tr
      className="group cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
      onClick={() => onClick(venta.doctoPvId)}
    >
      <td className="py-3 pl-8 pr-4">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {fecha}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs tracking-wider text-foreground">
          {venta.folio}
        </span>
      </td>
      <td className="px-4 py-3">
        <TipoBadge tipo={venta.tipo} />
      </td>
      <td className="px-4 py-3 text-right">
        <span className="tabular-nums font-mono text-[13px] text-foreground">
          {formatMoney(venta.total)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={cn(
            "tabular-nums font-mono text-[13px]",
            Number(venta.saldoVenta) > 0
              ? "text-foreground"
              : "text-muted-foreground/50",
          )}
        >
          {formatMoney(venta.saldoVenta)}
        </span>
      </td>
      <td className="py-3 pl-4 pr-8 text-right">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {venta.numPagos}
        </span>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface Props {
  ventas: ReadonlyArray<VentaCliente>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: DomainError | null;
  hasMore: boolean;
  loadMore: () => void;
  onVentaClick: (doctoPvId: number) => void;
}

export function FichaVentasList({
  ventas,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  loadMore,
  onVentaClick,
}: Props) {
  return (
    <section className="px-0 py-8" aria-label="Historial de ventas">
      <div className="mb-5 px-8">
        <h3 className="font-serif text-base font-normal text-foreground">
          Historial de ventas
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          más recientes primero
        </p>
      </div>

      {/* Loading skeleton */}
      {isLoading && ventas.length === 0 && (
        <div className="space-y-2 px-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="px-8 py-6 text-center">
          <p className="font-mono text-[11px] text-muted-foreground">
            {error.message}
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && ventas.length === 0 && (
        <div className="px-8 py-6 text-center">
          <p className="font-mono text-[11px] text-muted-foreground/60">
            Sin ventas registradas
          </p>
        </div>
      )}

      {/* Table */}
      {ventas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 pl-8 pr-4 text-left font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Fecha
                </th>
                <th className="px-4 py-2 text-left font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Folio
                </th>
                <th className="px-4 py-2 text-left font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Tipo
                </th>
                <th className="px-4 py-2 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Total
                </th>
                <th className="px-4 py-2 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Saldo
                </th>
                <th className="py-2 pl-4 pr-8 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Pagos
                </th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <VentaRow
                  key={v.doctoPvId}
                  venta={v}
                  onClick={onVentaClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 px-8 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="gap-1.5 font-mono text-xs text-muted-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            {isLoadingMore ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </section>
  );
}
