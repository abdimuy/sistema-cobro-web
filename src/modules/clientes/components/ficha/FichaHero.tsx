import { cn } from "@/lib/utils";
import ScoreBadge from "../badges/ScoreBadge";
import SegmentoBadge from "../badges/SegmentoBadge";
import { formatMoney } from "../lib/format";
import type { FichaCliente } from "../../domain/entities/FichaCliente";

interface Props {
  ficha: FichaCliente;
}

export function FichaHero({ ficha }: Props) {
  const { pulso } = ficha;

  return (
    <section className="border-b border-border/60 px-8 py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="min-w-0 flex-1 space-y-3">
          <h1
            className={cn(
              "font-serif text-[36px] font-normal leading-[1.1] tracking-tight text-foreground",
            )}
          >
            {ficha.nombre}
          </h1>

          {/* Mono metadata line */}
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Zona {ficha.zona}
            {ficha.cobrador && ` · ${ficha.cobrador}`}
            {` · #${ficha.clienteId}`}
            {` · ${ficha.estatus}`}
          </p>

          {/* Address */}
          <p className="font-mono text-[11px] text-muted-foreground/70">
            {[
              ficha.direccion.calle,
              ficha.direccion.colonia,
              ficha.direccion.poblacion,
              ficha.direccion.estado,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>

          {/* Límite + notas */}
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {ficha.limiteCredito && Number(ficha.limiteCredito) > 0 && (
              <p className="font-mono text-[11px] text-muted-foreground/60">
                Límite crédito{" "}
                <span className="tabular-nums text-foreground/70">
                  {formatMoney(ficha.limiteCredito)}
                </span>
              </p>
            )}
            {ficha.notas && (
              <p className="font-mono text-[11px] text-muted-foreground/60 italic">
                {ficha.notas}
              </p>
            )}
          </div>
        </div>

        {/* Right: Saldo + Score */}
        <div className="flex shrink-0 flex-col gap-6 lg:items-end">
          {/* Saldo big number */}
          <div className="lg:text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              SALDO
            </p>
            <p
              className={cn(
                "tabular-nums font-serif text-[44px] font-normal leading-none",
                Number(ficha.resumen.saldo) > 0
                  ? "text-foreground"
                  : "text-muted-foreground/50",
              )}
            >
              {formatMoney(ficha.resumen.saldo)}
            </p>
          </div>

          {/* Score + Segmento */}
          {pulso ? (
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Score
                </span>
                <span className="tabular-nums font-serif text-2xl font-normal text-foreground">
                  {pulso.score}
                </span>
                <ScoreBadge score={pulso.score} tienePulso />
              </div>
              <SegmentoBadge value={pulso.segmento} />
            </div>
          ) : (
            <p className="font-mono text-[11px] text-muted-foreground/50">
              Sin pulso analítico
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
