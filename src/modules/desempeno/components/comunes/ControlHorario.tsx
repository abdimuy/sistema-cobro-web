import { cn } from "@/lib/utils";
import { HORARIO_PREDETERMINADO } from "../../presentation/preferencias";
import { usePreferencias } from "../../presentation/context/usePreferencias";

const INICIOS = ["07:00", "07:30", "08:00", "08:30", "09:00"];
const FINES = ["17:00", "17:30", "18:00", "18:30", "19:00"];
const SELECT = "h-9 rounded-full bg-dsm-tarjeta pl-3.5 pr-7 text-[13px] ring-1 ring-border disabled:opacity-50";

// ControlHorario (D7): interruptor y rango del horario que viaja en la
// consulta. Lo comparten el tablero y la jornada de la ficha.
export function ControlHorario() {
  const { horario, setHorario } = usePreferencias();
  const conHorario = horario !== null;
  const actual = horario ?? HORARIO_PREDETERMINADO;
  return (
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
  );
}
