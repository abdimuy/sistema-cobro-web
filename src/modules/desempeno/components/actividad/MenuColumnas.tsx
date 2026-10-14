import { Columns3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ClaveColumna } from "../../presentation/actividadPreferencias";
import { COLUMNAS } from "./columnas";

export function MenuColumnas({
  columnas,
  onAlternar,
}: {
  columnas: readonly ClaveColumna[];
  onAlternar: (c: ClaveColumna) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-dsm-tarjeta px-3.5 text-[13px] ring-1 ring-border hover:bg-muted"
        >
          <Columns3 aria-hidden className="h-3.5 w-3.5" />
          Columnas
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        {COLUMNAS.map((c) => (
          <label
            key={c.clave}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={columnas.includes(c.clave)}
              onChange={() => onAlternar(c.clave)}
            />
            {c.titulo}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
