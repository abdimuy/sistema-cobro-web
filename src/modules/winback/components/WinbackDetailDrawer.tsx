import React from "react";
import { Phone, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { WinbackItem } from "../domain/entities";
import SegmentoBadge from "./badges/SegmentoBadge";
import EstadoPagoBadge from "./badges/EstadoPagoBadge";
import TierBadge from "./badges/TierBadge";
import {
  formatMoney,
  formatPercent,
  formatFecha,
  formatDiasLargo,
} from "./lib/format";

interface Props {
  item: WinbackItem | null;
  onOpenChange: (open: boolean) => void;
}

const WinbackDetailDrawer: React.FC<Props> = ({ item, onOpenChange }) => {
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] overflow-y-auto p-0"
      >
        {item && <DrawerBody item={item} />}
      </SheetContent>
    </Sheet>
  );
};

// ── Inner body — only rendered when item is present ───────────────────────────

interface BodyProps {
  item: WinbackItem;
}

const DrawerBody: React.FC<BodyProps> = ({ item }) => {
  const kicker =
    item.etiqueta.trim() !== ""
      ? item.etiqueta
      : `Zona ${item.zona} · Score ${item.score}`;

  const telHref = item.telefono.trim() !== "" ? `tel:${item.telefono}` : null;

  return (
    <div className="space-y-6 px-6 pb-10 pt-10">
      {/* ── Header block ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {kicker}
        </p>

        <SheetTitle className="font-serif text-[28px] sm:text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          {item.nombre}
        </SheetTitle>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <SegmentoBadge value={item.segmento.value} />
          <EstadoPagoBadge value={item.estadoPago.value} />
          <TierBadge value={item.tier.value} />
          {item.enControl && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Control
            </span>
          )}
        </div>

        {/* Call action */}
        <div className="flex flex-col gap-1 pt-1">
          {telHref ? (
            <Button asChild className="w-full sm:w-auto">
              <a href={telHref}>
                <Phone className="h-4 w-4" />
                Llamar
              </a>
            </Button>
          ) : (
            <Button disabled className="w-full sm:w-auto">
              <Phone className="h-4 w-4" />
              Llamar
            </Button>
          )}
          {item.telefono.trim() !== "" && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {item.telefono}
            </p>
          )}
        </div>
      </div>

      {/* ── Resumen ───────────────────────────────────────────────────────── */}
      {item.resumen.trim() !== "" && (
        <blockquote className="border-l-2 border-foreground/20 pl-4 font-serif text-base italic leading-relaxed text-foreground/80">
          {item.resumen}
        </blockquote>
      )}

      {/* ── Indicadores card ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border/60 bg-card">
        <header className="border-b border-border/60 px-5 py-3">
          <h3 className="font-serif text-lg font-normal text-foreground">
            Indicadores
          </h3>
          <p className="text-xs text-muted-foreground">
            {item.frecuencia} compras · {formatDiasLargo(item.recenciaDias)} sin comprar
          </p>
        </header>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-3">
          <Stat label="Valor" value={formatMoney(item.monetary)} />
          <Stat label="Saldo" value={formatMoney(item.saldo)} />
          <Stat label="Por liquidar" value={formatPercent(item.porLiquidarPct)} />
          <Stat label="Recencia" value={formatDiasLargo(item.recenciaDias)} />
          <Stat label="Frecuencia" value={`${item.frecuencia} compras`} />
          <Stat label="Última compra" value={formatFecha(item.fechaUltimaCompra)} />
          <Stat label="Último pago" value={formatFecha(item.fechaUltimoPago)} />
        </dl>
      </section>

      {/* ── Ofrecer ───────────────────────────────────────────────────────── */}
      {item.nextBestProduct.trim() !== "" && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Ofrecer
          </p>
          <p className="mt-1 flex items-center gap-2 font-serif text-lg text-foreground">
            {item.nextBestProduct}
            <Sparkles className="h-4 w-4 text-muted-foreground/60" />
          </p>
        </div>
      )}
    </div>
  );
};

// ── Stat DL item ──────────────────────────────────────────────────────────────

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="tabular mt-1 font-mono text-[15px] font-medium text-foreground">
      {value}
    </dd>
  </div>
);

export default WinbackDetailDrawer;
