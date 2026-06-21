import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFichaCliente } from "../../presentation/hooks/useFichaCliente";
import { useVentasCliente } from "../../presentation/hooks/useVentasCliente";
import { useRitmoPago } from "../../presentation/hooks/useRitmoPago";
import { VentaModal } from "../detalle/VentaModal";
import { PagoModal } from "../detalle/PagoModal";
import { FichaHeader } from "./FichaHeader";
import { FichaHero } from "./FichaHero";
import { FichaKpis } from "./FichaKpis";
import { FichaCharts } from "./FichaCharts";
import { FichaUbicacion } from "./FichaUbicacion";
import { FichaInteligenciaScores } from "./FichaInteligenciaScores";
import { FichaLecturaAnalista } from "./FichaLecturaAnalista";
import { FichaVentasList } from "./FichaVentasList";
import { FichaRitmoPago } from "./FichaRitmoPago";
import { FichaSaludStrip } from "./FichaSaludStrip";
import { ReporteModal } from "./ReporteModal";

interface Props {
  clienteId: number;
}

export function ClienteFicha({ clienteId }: Props) {
  const { ficha, isLoading, error } = useFichaCliente(clienteId);
  const ventasState = useVentasCliente(clienteId);
  const ritmoState = useRitmoPago(clienteId);
  const [selectedDoctoPvId, setSelectedDoctoPvId] = useState<number | null>(
    null,
  );
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [reporteOpen, setReporteOpen] = useState(false);

  // Full-page loading (first load only)
  if (isLoading && !ficha) {
    return (
      <div className="space-y-0 divide-y divide-border/60">
        {/* Header skeleton */}
        <div className="flex h-[56px] items-center px-6">
          <Skeleton className="h-4 w-40" />
        </div>
        {/* Hero skeleton */}
        <div className="px-8 py-10 space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-48" />
        </div>
        {/* KPIs skeleton */}
        <div className="flex gap-0 px-8 py-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 px-6 space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full-page error
  if (error && !ficha) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="font-serif text-xl font-normal text-foreground">
          No se pudo cargar el cliente
        </p>
        <p className="max-w-sm font-mono text-[11px] text-muted-foreground">
          {error.message}
        </p>
      </div>
    );
  }

  if (!ficha) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px]">
      {/* ── Zona 1 — Identidad y acción ── */}
      <FichaHeader ficha={ficha} onReporteClick={() => setReporteOpen(true)} />
      <FichaHero ficha={ficha} />
      <FichaSaludStrip resumen={ficha.resumen} pulso={ficha.pulso} />
      {/* Ocultos por ahora (siguen en el repo para reactivarlos):
          - Acción recomendada (FichaNextBestAction): el motor aún no está listo.
          - Filtro de rango de fechas (FichaRangeFilter): a pedido del usuario. */}
      <FichaKpis resumen={ficha.resumen} isLoading={isLoading} />

      {/* ── Zona 2 — Inteligencia ── */}
      <FichaRitmoPago ritmo={ritmoState.ritmo} isLoading={ritmoState.isLoading} onVentaClick={setSelectedDoctoPvId} onPagoClick={setSelectedPagoId} pulso={ficha.pulso} />
      <FichaInteligenciaScores pulso={ficha.pulso} />
      <FichaLecturaAnalista pulso={ficha.pulso} />

      {/* ── Zona 3 — Detalle ── */}
      <FichaCharts
        compradoVsAbonado={ficha.resumen.compradoVsAbonado}
        isLoading={isLoading}
      />
      <FichaUbicacion ubicacion={ficha.ubicacion} />
      <FichaVentasList
        ventas={ventasState.ventas}
        isLoading={ventasState.isLoading}
        isLoadingMore={ventasState.isLoadingMore}
        error={ventasState.error}
        hasMore={ventasState.hasMore}
        loadMore={ventasState.loadMore}
        onVentaClick={setSelectedDoctoPvId}
      />

      <VentaModal
        clienteId={clienteId}
        doctoPvId={selectedDoctoPvId}
        open={selectedDoctoPvId !== null}
        onClose={() => setSelectedDoctoPvId(null)}
        onPagoClick={setSelectedPagoId}
      />
      <PagoModal
        clienteId={clienteId}
        doctoCcId={selectedPagoId}
        onClose={() => setSelectedPagoId(null)}
      />
      <ReporteModal
        open={reporteOpen}
        onClose={() => setReporteOpen(false)}
        clienteId={clienteId}
        ventas={ventasState.ventas}
        hasMore={ventasState.hasMore}
        loadMore={ventasState.loadMore}
        isLoadingMore={ventasState.isLoadingMore}
      />
      </div>
    </div>
  );
}
