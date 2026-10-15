import { cn } from "@/lib/utils";
import type { Actividad } from "../../domain/entities";

/** La nota que escribió el cobrador en la visita, o null si no hay. */
function notaDeVisita(a: Actividad): string | null {
  const nota = a.visita?.nota?.trim();
  return nota ? nota : null;
}

// NotaVisita: la nota personalizada de una visita, en una sola línea; el texto
// completo sale al pasar el ratón (title). Los pagos no traen nota. Sin nota no
// pinta nada, salvo con `vacio`, que deja un guion tenue (celda de tabla).
export function NotaVisita({
  actividad,
  className,
  vacio = false,
}: {
  actividad: Actividad;
  className?: string;
  vacio?: boolean;
}) {
  const nota = notaDeVisita(actividad);
  if (!nota) return vacio ? <span className="text-muted-foreground">—</span> : null;
  return (
    <span data-testid="nota-visita" title={nota} className={cn("truncate", className)}>
      {nota}
    </span>
  );
}
