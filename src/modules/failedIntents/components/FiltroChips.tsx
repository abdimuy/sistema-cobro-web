import { LINEA, TEXTO_2 } from "./paleta";

// FiltroChips son los filtros de la consola: chips bajo el título, no una
// barra lateral.
//
// Dos decisiones deliberadas:
//
//   • **La pantalla no trae barra lateral propia.** La app ya tiene la suya;
//     una segunda columna de navegación compite con ella y obliga a decidir
//     dos veces dónde estás parado.
//   • **Los filtros ACOTAN, no estructuran.** La estructura es la partición
//     por urgencia —lo que necesita a alguien arriba, lo que se cura solo
//     abajo—, y esa estructura no cambia según el chip que esté prendido. Un
//     filtro que reorganiza la pantalla obliga a re-aprenderla en cada clic.
//   • **El filtro de módulo va al SERVIDOR.** Los chips mandan `?modulo=` y la
//     consulta lo resuelve con su índice. Acotar en memoria la página ya
//     recibida mostraría "las ventas que cupieron en los primeros veinte
//     renglones" y nada advertiría del resto.
//
//     Consecuencia visible: sólo el chip ACTIVO lleva número. Los demás no se
//     pueden contar sin pedir su propia consulta, y un número traído de la
//     página anterior sería un número inventado.
export const CHIPS_MODULO = ["todo", "ventas", "pagos"] as const;
export const CHIPS_ESTADO = ["resueltas", "ignoradas"] as const;

export type FiltroValue = (typeof CHIPS_MODULO)[number] | (typeof CHIPS_ESTADO)[number];

const ETIQUETAS: Record<FiltroValue, string> = {
  todo: "Todo",
  ventas: "Ventas",
  pagos: "Pagos",
  resueltas: "Resueltas",
  ignoradas: "Ignoradas",
};

export function FiltroChips({
  value,
  conteos,
  onChange,
}: {
  value: FiltroValue;
  conteos: Partial<Record<FiltroValue, number>>;
  onChange: (next: FiltroValue) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filtros">
      {CHIPS_MODULO.map((k) => (
        <Chip key={k} valor={k} activo={value === k} conteo={conteos[k]} onChange={onChange} />
      ))}
      <span aria-hidden="true" className="w-px h-[18px] bg-border mx-1.5" />
      {CHIPS_ESTADO.map((k) => (
        <Chip key={k} valor={k} activo={value === k} conteo={conteos[k]} onChange={onChange} />
      ))}
    </div>
  );
}

function Chip({
  valor,
  activo,
  conteo,
  onChange,
}: {
  valor: FiltroValue;
  activo: boolean;
  conteo?: number;
  onChange: (next: FiltroValue) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      data-testid={`filtro-${valor}`}
      onClick={() => onChange(valor)}
      className={[
        "text-[12.5px] px-[11px] py-1 rounded-full border cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        activo
          ? "bg-primary border-primary text-primary-foreground font-semibold"
          : `bg-transparent ${LINEA} ${TEXTO_2} hover:border-input`,
      ].join(" ")}
    >
      {ETIQUETAS[valor]}
      {conteo !== undefined && <span className="opacity-60 ml-[5px] tabular-nums">{conteo}</span>}
    </button>
  );
}
