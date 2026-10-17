import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de la ficha con la forma real: las 7 tarjetas de cifras
// (`FichaEncabezado`, misma rejilla y alturas). Con `completo` agrega el
// nombre, las pestañas y la tarjeta "Línea del día" (primera carga, sin marco).
const TARJETAS = 7;

export function FichaEsqueleto({ completo = false }: { completo?: boolean }) {
  const tarjetas = (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
      {Array.from({ length: TARJETAS }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-1.5 rounded-[14px] bg-dsm-tarjeta px-4 py-3.5 shadow-sm ring-1 ring-border"
        >
          <Skeleton className="h-[15px] w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
  if (!completo) return <div data-testid="ficha-esqueleto">{tarjetas}</div>;
  return (
    <div data-testid="ficha-esqueleto" aria-busy="true" className="flex flex-col gap-6 px-10 pb-24 pt-9">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-[52px] w-80" />
        </div>
        <Skeleton className="h-[72px] w-56" />
      </div>
      {tarjetas}
      <Skeleton className="h-[34px] w-96 rounded-full" />
      <Skeleton className="h-48 w-full rounded-[14px]" />
    </div>
  );
}
