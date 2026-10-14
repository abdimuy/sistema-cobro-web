import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { diasEntre, fechaCorta, fechaLarga, sumarDias } from "../lib/format";

// Flechas para cualquier día pasado (la jornada sirve para cualquier fecha,
// spec §1) y chips para los días de la semana en curso del usuario.
export function NavegadorDia({
  dia,
  hoy,
  inicioSemanaDia,
  onCambiar,
}: {
  dia: string;
  hoy: string;
  inicioSemanaDia: string | null;
  onCambiar: (dia: string) => void;
}) {
  const semana = inicioSemanaDia ? diasEntre(inicioSemanaDia, hoy) : [];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Día anterior"
          onClick={() => onCambiar(sumarDias(dia, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </button>
        <div className="min-w-[180px] text-center font-serif text-lg first-letter:uppercase">
          {fechaLarga(dia)}
          {dia === hoy && (
            <small className="ml-2 font-mono text-[10px] uppercase text-dsm-marca">hoy</small>
          )}
        </div>
        <button
          type="button"
          aria-label="Día siguiente"
          disabled={dia >= hoy}
          onClick={() => onCambiar(sumarDias(dia, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {semana.map((d) => {
          const etiqueta = fechaCorta(d).split(" ").slice(0, 2).join(" ");
          return (
            <button
              key={d}
              type="button"
              aria-label={etiqueta}
              aria-pressed={d === dia}
              onClick={() => onCambiar(d)}
              className={cn(
                "h-7 rounded-full px-2.5 font-mono text-[11px]",
                d === dia
                  ? "bg-foreground text-background"
                  : "bg-dsm-tarjeta ring-1 ring-border hover:bg-muted",
              )}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
