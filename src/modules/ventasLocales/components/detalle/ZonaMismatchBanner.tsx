import { AlertTriangle } from "lucide-react";
import useGetZonasCliente from "@/hooks/useGetZonasCliente";

interface Props {
  ventaZonaId: number | null | undefined;
  microsipZonaId: number | null | undefined;
}

const resolveZonaNombre = (
  id: number | null | undefined,
  getZonaById: (id: number) => { ZONA_CLIENTE_ID: number; ZONA_CLIENTE: string } | undefined
): string => {
  if (id == null) return "Sin zona";
  return getZonaById(id)?.ZONA_CLIENTE ?? `Zona ${id}`;
};

const ZonaMismatchBanner = ({ ventaZonaId, microsipZonaId }: Props) => {
  const { getZonaById } = useGetZonasCliente();

  const ventaZonaNombre = resolveZonaNombre(ventaZonaId, getZonaById);
  const microsipZonaNombre = resolveZonaNombre(microsipZonaId, getZonaById);

  return (
    <div className="border-l-2 border-amber-500 bg-amber-500/5 px-6 py-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-700">Zona no coincide</p>
          <p className="text-sm text-foreground/80">
            Venta: <span className="font-medium">{ventaZonaNombre}</span> · Cliente en Microsip:{" "}
            <span className="font-medium">{microsipZonaNombre}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ZonaMismatchBanner;
