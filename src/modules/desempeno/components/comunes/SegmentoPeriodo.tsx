import { cn } from "@/lib/utils";
import type { Periodo } from "../../domain/entities";
import { usePreferencias } from "../../presentation/context/usePreferencias";

const OPCIONES: ReadonlyArray<readonly [Periodo, string]> = [
  ["hoy", "Hoy"],
  ["semana", "Semana"],
];

// Hoy/Semana (D8). Vive en Tarea 0 porque lo usan el tablero (carril 1) y la
// ficha (carril 2).
export function SegmentoPeriodo() {
  const { periodo, setPeriodo } = usePreferencias();
  return (
    <div role="group" aria-label="Periodo" className="inline-flex rounded-full bg-dsm-tarjeta p-[3px] shadow-sm ring-1 ring-border">
      {OPCIONES.map(([valor, texto]) => (
        <button
          key={valor}
          type="button"
          aria-pressed={periodo === valor}
          onClick={() => setPeriodo(valor)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[13px] transition-colors",
            periodo === valor ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}
