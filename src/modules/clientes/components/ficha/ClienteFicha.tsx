import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

// Tab deep-link param: ?tab=resumen|analisis|pagos|productos
const VALID_TABS = ["resumen", "analisis", "pagos", "productos"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isValidTab(v: string | null): v is TabValue {
  return VALID_TABS.includes(v as TabValue);
}

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

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabValue = isValidTab(rawTab) ? rawTab : "resumen";

  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        return next;
      },
      { replace: true },
    );
  };

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
        {/* Always-visible: back button + title + acciones (reporte, etc.) */}
        <FichaHeader ficha={ficha} onReporteClick={() => setReporteOpen(true)} />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="sticky top-0 z-10 bg-background border-b border-border/60 px-6 py-2">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="analisis">Análisis & predicción</TabsTrigger>
              <TabsTrigger value="pagos">Pagos & solvencia</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1 — Resumen: identidad, salud, narrativa IA y gráficas */}
          <TabsContent value="resumen">
            <FichaHero ficha={ficha} />
            <FichaSaludStrip resumen={ficha.resumen} pulso={ficha.pulso} />
            {/* Ocultos por ahora (siguen en el repo para reactivarlos):
                - Acción recomendada (FichaNextBestAction): motor aún no listo.
                - Filtro de rango de fechas (FichaRangeFilter): a pedido del usuario. */}
            <FichaKpis resumen={ficha.resumen} isLoading={isLoading} />
            <FichaCharts
              compradoVsAbonado={ficha.resumen.compradoVsAbonado}
              isLoading={isLoading}
            />
            <FichaLecturaAnalista pulso={ficha.pulso} />
            <FichaUbicacion ubicacion={ficha.ubicacion} />
          </TabsContent>

          {/* Tab 2 — Análisis & predicción: tres scores de inteligencia */}
          <TabsContent value="analisis">
            <FichaInteligenciaScores pulso={ficha.pulso} />
          </TabsContent>

          {/* Tab 3 — Pagos & solvencia: heatmap/timeline de pagos */}
          <TabsContent value="pagos">
            <FichaRitmoPago
              ritmo={ritmoState.ritmo}
              isLoading={ritmoState.isLoading}
              onVentaClick={setSelectedDoctoPvId}
              onPagoClick={setSelectedPagoId}
              pulso={ficha.pulso}
            />
          </TabsContent>

          {/* Tab 4 — Productos: historial de ventas */}
          <TabsContent value="productos">
            <FichaVentasList
              ventas={ventasState.ventas}
              isLoading={ventasState.isLoading}
              isLoadingMore={ventasState.isLoadingMore}
              error={ventasState.error}
              hasMore={ventasState.hasMore}
              loadMore={ventasState.loadMore}
              onVentaClick={setSelectedDoctoPvId}
            />
          </TabsContent>
        </Tabs>

        {/* Modals rendered at top level so any tab can open them */}
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
