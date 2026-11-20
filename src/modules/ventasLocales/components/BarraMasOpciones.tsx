import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface OpcionMas {
  id: string;
  etiqueta: string;
  control: ReactNode;
}

/** Botón "⋯" con los controles que no caben en la barra, uno por renglón. */
export function BarraMasOpciones({ opciones }: { opciones: OpcionMas[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Más opciones"
          className="h-8 w-8 flex-none border-border/50 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto min-w-[220px] p-2">
        <div className="flex flex-col gap-1">
          {opciones.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-4 rounded px-1.5 py-1">
              <span className="text-xs text-muted-foreground">{o.etiqueta}</span>
              {o.control}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
