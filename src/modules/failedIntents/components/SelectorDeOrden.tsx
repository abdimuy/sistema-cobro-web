import { ArrowDownWideNarrow } from "lucide-react";
import type { OrdenLista } from "../application/usecases/listarIntentosAgrupados";

// Las etiquetas dicen el criterio, no el mecanismo: quien mira la pantalla
// piensa "lo más reciente", no "descendente por fecha".
const OPCIONES: ReadonlyArray<{ valor: OrdenLista; etiqueta: string }> = [
  { valor: "recientes", etiqueta: "Más reciente" },
  { valor: "antiguos", etiqueta: "Más antiguo" },
  { valor: "monto", etiqueta: "Mayor monto" },
  { valor: "intentos", etiqueta: "Más intentos" },
];

export function SelectorDeOrden({
  valor,
  onChange,
}: {
  valor: OrdenLista;
  onChange: (v: OrdenLista) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500">
      <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">Ordenar por</span>
      <select
        aria-label="Ordenar por"
        data-testid="selector-orden"
        value={valor}
        onChange={(e) => onChange(e.target.value as OrdenLista)}
        className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 text-[12px] text-foreground"
      >
        {OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}

