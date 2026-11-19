import { cn } from "@/lib/utils";
import type {
  ConteoOrigen,
  FiltroOrigen,
} from "../domain/values/Coincidencia";

interface Props {
  value: FiltroOrigen;
  conteo?: ConteoOrigen;
  onChange: (o: FiltroOrigen) => void;
}

const ETIQUETA = (n: number | null | undefined, conteo: boolean) =>
  !conteo ? "" : n === null || n === undefined ? " —" : ` ${n}`;

export function OrigenFiltro({ value, conteo, onChange }: Props) {
  const total =
    conteo && conteo.app !== null && conteo.archivo !== null
      ? conteo.app + conteo.archivo
      : undefined;
  const opciones: Array<{ id: FiltroOrigen; label: string; sufijo: string }> = [
    { id: "todas", label: "Todas", sufijo: total === undefined ? "" : ` ${total}` },
    { id: "app", label: "App", sufijo: ETIQUETA(conteo?.app, !!conteo) },
    { id: "archivo", label: "Archivo", sufijo: ETIQUETA(conteo?.archivo, !!conteo) },
  ];
  return (
    <div
      role="group"
      aria-label="Origen"
      className="inline-flex gap-0.5 rounded-md border bg-muted p-0.5"
    >
      {opciones.map((o) => {
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
            {o.sufijo && (
              <span className="font-normal text-muted-foreground">{o.sufijo}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
