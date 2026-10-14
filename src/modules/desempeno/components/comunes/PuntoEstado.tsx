import { cn } from "@/lib/utils";
import type { EstadoAhora } from "../../domain/entities";

const CLASE: Record<EstadoAhora, string> = {
  activo: "bg-dsm-ok ring-[3px] ring-[hsl(var(--dsm-ok-fondo))]",
  sin_actividad: "bg-dsm-ambar ring-[3px] ring-[hsl(var(--dsm-ambar-fondo))]",
  no_ha_empezado: "bg-muted-foreground/50",
};

export function PuntoEstado({ estado }: { estado: EstadoAhora }) {
  return (
    <span
      aria-hidden
      data-estado={estado}
      className={cn("inline-block h-[7px] w-[7px] flex-none rounded-full", CLASE[estado])}
    />
  );
}
