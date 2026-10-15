import { Search } from "lucide-react";
import { usePreferencias } from "../../presentation/context/usePreferencias";
import { SegmentoPeriodo } from "../comunes/SegmentoPeriodo";
import { ControlUmbralPausa } from "../comunes/ControlUmbralPausa";
import { ControlHorario } from "../comunes/ControlHorario";
import { SelectorVista } from "../linea/SelectorVista";
import { Leyenda } from "../linea/Leyenda";

// TableroToolbar: periodo (D8), umbral de pausa y horario (D7, viajan en la
// consulta), vista de la línea (D16), búsqueda y leyenda.
export function TableroToolbar({ q, onQ }: { q: string; onQ: (q: string) => void }) {
  const { pausaMin, setPausaMin, vista } = usePreferencias();
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <SegmentoPeriodo />
      <ControlUmbralPausa valor={pausaMin} onCambiar={setPausaMin} />
      <SelectorVista />
      <ControlHorario />
      <label className="relative">
        <Search aria-hidden className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          aria-label="Buscar cobrador o zona"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Buscar cobrador o zona"
          className="h-9 w-[260px] rounded-full bg-dsm-tarjeta pl-8 pr-3 text-[13px] outline-none ring-1 ring-border focus:ring-foreground/40"
        />
      </label>
      <Leyenda vista={vista} />
    </div>
  );
}
