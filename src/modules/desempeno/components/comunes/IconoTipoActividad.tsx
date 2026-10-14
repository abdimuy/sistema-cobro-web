import { cn } from "@/lib/utils";
import type { TipoActividad } from "../../domain/entities";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";

export function IconoTipoActividad({ tipo }: { tipo: TipoActividad }) {
  const meta = TIPO_ACTIVIDAD_META[tipo];
  const Icono = meta.icono;
  return (
    <span
      aria-label={meta.etiqueta}
      className={cn("inline-flex h-7 w-7 flex-none items-center justify-center rounded-md", meta.claseIcono)}
    >
      <Icono aria-hidden className="h-3.5 w-3.5" />
    </span>
  );
}
