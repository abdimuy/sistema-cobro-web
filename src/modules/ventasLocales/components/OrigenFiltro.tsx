import { cn } from "@/lib/utils";
import type { FiltroOrigen } from "../domain/values/Coincidencia";

interface Props {
  value: FiltroOrigen;
  onChange: (o: FiltroOrigen) => void;
}

// Sin totales por pestaña (decisión del dueño, 2026-11-20): sólo las etiquetas.
const OPCIONES: Array<{ id: FiltroOrigen; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "app", label: "App" },
  { id: "archivo", label: "Archivo" },
];

export function OrigenFiltro({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Origen"
      className="inline-flex flex-none gap-0.5 rounded-md border bg-muted p-0.5"
    >
      {OPCIONES.map((o) => {
        const activo = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.id)}
            className={cn(
              "min-h-8 rounded px-3 text-[13px] font-medium",
              activo
                ? "border bg-card text-foreground shadow-sm"
                : "border border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
