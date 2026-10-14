import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { HORARIO_PREDETERMINADO, UMBRALES_PAUSA } from "../../presentation/preferencias";
import { usePreferencias } from "../../presentation/context/usePreferencias";
import { SegmentoPeriodo } from "../comunes/SegmentoPeriodo";
import { SelectorVista } from "../linea/SelectorVista";
import { Leyenda } from "../linea/Leyenda";

const INICIOS = ["07:00", "07:30", "08:00", "08:30", "09:00"];
const FINES = ["17:00", "17:30", "18:00", "18:30", "19:00"];
const SELECT = "h-9 rounded-full bg-dsm-tarjeta pl-3.5 pr-7 text-[13px] ring-1 ring-border disabled:opacity-50";

// TableroToolbar: periodo (D8), umbral de pausa y horario (D7, viajan en la
// consulta), vista de la línea (D16), búsqueda y leyenda.
export function TableroToolbar({ q, onQ }: { q: string; onQ: (q: string) => void }) {
  const { pausaMin, setPausaMin, horario, setHorario, vista } = usePreferencias();
  const conHorario = horario !== null;
  const actual = horario ?? HORARIO_PREDETERMINADO;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <SegmentoPeriodo />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        Pausa desde
        <select className={SELECT} value={pausaMin} onChange={(e) => setPausaMin(Number(e.target.value))}>
          {UMBRALES_PAUSA.map((m) => (
            <option key={m} value={m}>{`${m} min`}</option>
          ))}
        </select>
      </label>
      <SelectorVista />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          aria-pressed={conHorario}
          onClick={() => setHorario(conHorario ? null : HORARIO_PREDETERMINADO)}
          className={cn(
            "h-9 rounded-full px-3.5 text-[13px] ring-1 ring-border",
            conHorario ? "bg-foreground text-background" : "bg-dsm-tarjeta text-foreground",
          )}
        >
          Horario
        </button>
        <select
          aria-label="Inicio de horario"
          className={SELECT}
          disabled={!conHorario}
          value={actual.desde}
          onChange={(e) => setHorario({ desde: e.target.value, hasta: actual.hasta })}
        >
          {INICIOS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        –
        <select
          aria-label="Fin de horario"
          className={SELECT}
          disabled={!conHorario}
          value={actual.hasta}
          onChange={(e) => setHorario({ desde: actual.desde, hasta: e.target.value })}
        >
          {FINES.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
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
