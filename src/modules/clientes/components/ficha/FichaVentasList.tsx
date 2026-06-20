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
// Liquidación badge
// ---------------------------------------------------------------------------

function LiquidadaBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] tracking-wider text-green-500"
      aria-label="Liquidada"
    >
      ✓ Liquidada
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
  const isLiquidada = Number(venta.saldoVenta) === 0;
  // Trim "HH:MM:SS" to "HH:MM" for compact display
  const horaDisplay = venta.hora.length >= 5 ? venta.hora.slice(0, 5) : venta.hora;

  return (
    <tr
      className={cn(
        "group cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30",
        isLiquidada ? "border-l-2 border-l-green-500" : "border-l-2 border-l-amber-500",
      )}
      onClick={() => onClick(venta.doctoPvId)}
    >
      <td className="py-3 pl-6 pr-4">
        <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {fecha}{" "}
          <span className="text-muted-foreground/60">· {horaDisplay}</span>
        </div>
        {/* Second line: article + almacén */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {venta.primerArticulo && (
            <span className="text-foreground/80">{venta.primerArticulo}</span>
          )}
          {venta.numArticulos > 1 && (
            <span className="rounded border border-green-500/20 bg-green-500/10 px-1 font-mono text-[10px] text-green-500">
              +{venta.numArticulos - 1} más
            </span>
          )}
          {(venta.primerArticulo || venta.numArticulos > 1) && venta.almacen && (
            <span className="text-muted-foreground/50">·</span>
          )}
          {venta.almacen && (
            <span className="font-mono text-[10px] tracking-wide text-muted-foreground/60">
              {venta.almacen}
            </span>
          )}
        </div>
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
        {isLiquidada ? (
          <LiquidadaBadge />
        ) : (
          <div className="text-right">
            <span className="font-serif tabular-nums text-[15px] text-amber-400">
              {formatMoney(venta.saldoVenta)}
            </span>
            <span className="block font-mono text-[9px] uppercase tracking-wider text-amber-400/80">
              debe
            </span>
          </div>
        )}
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
