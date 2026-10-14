import { cn } from "@/lib/utils";
import type { Actividad } from "../../domain/entities";
import { dinero } from "../lib/format";
import { ChipTrato } from "./ChipTrato";

// Monto o resultado de una actividad. Una visita muestra el literal que
// capturó el teléfono, pintado con el `trato` que manda el servidor (contrato
// v2): color + ícono vienen del API, el escritorio no los deriva del literal
// (D10). La etiqueta corta del servidor (`visita.etiqueta`) va en el popover.
export function MontoActividad({ actividad }: { actividad: Actividad }) {
  if (actividad.visita) {
    return <ChipTrato trato={actividad.visita.trato} etiqueta={actividad.visita.tipoVisita} />;
  }
  const pago = actividad.pago;
  if (!pago) return <span className="text-muted-foreground">—</span>;
  if (actividad.tipo === "condonacion") {
    return <span className="tabular text-dsm-violeta">−{dinero(pago.importe)}</span>;
  }
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn("tabular", pago.rechazado && "text-muted-foreground line-through")}>
        {dinero(pago.importe)}
      </span>
      {pago.rechazado ? (
        <span className="text-[11px] text-dsm-rojo">Rechazado</span>
      ) : !pago.aplicado ? (
        <span className="text-[11px] text-dsm-ambar">Sin aplicar</span>
      ) : null}
    </span>
  );
}
