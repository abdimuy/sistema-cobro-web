import { cn } from "@/lib/utils";
import type { Actividad } from "../../domain/entities";
import { refVentaDe, type AbrirVenta } from "./describirActividades";

// Folio de la venta de una actividad. Si el servidor mandó `docto_pv_id` y hay
// quien abra el detalle, el folio es un botón (también desde una visita); si
// no, es texto. El clic no abre además la actividad del renglón.
export function FolioVenta({
  actividad: a,
  onAbrirVenta,
  vacio = "—",
  className,
}: {
  actividad: Actividad;
  onAbrirVenta?: AbrirVenta;
  vacio?: string;
  className?: string;
}) {
  if (a.folio === null) return <span className={className}>{vacio}</span>;
  const ref = refVentaDe(a);
  if (!ref || !onAbrirVenta) return <span className={className}>{a.folio}</span>;
  return (
    <button
      type="button"
      aria-label={`Ver venta ${a.folio}`}
      onClick={(e) => {
        e.stopPropagation();
        onAbrirVenta(ref);
      }}
      className={cn("underline decoration-dotted underline-offset-2 hover:text-dsm-marca", className)}
    >
      {a.folio}
    </button>
  );
}
