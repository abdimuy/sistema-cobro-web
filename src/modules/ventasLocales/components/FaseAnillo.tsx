import type { Fase } from "./fase";

/**
 * El anillo de la fase: cuatro arcos sobre un bisel, con la cifra adentro.
 *
 * La geometría viene del diseño aprobado y no se toca: circunferencia 69.115
 * (r = 11), arco 12.85, huecos de 3.4 entre los tres primeros y 7.5 antes del
 * cuarto. Esa abertura ancha es DELIBERADA: marca el cruce a Microsip. No se
 * "corrige" a espaciado parejo.
 *
 * Los colores salen de los tokens del proyecto, que guardan canales HSL — de
 * ahí el `hsl(var(--token))`: `var(--token)` a secas no es un color válido y la
 * declaración se descarta.
 */

const DESPLAZAMIENTOS = [0, -16.25, -32.5, -52.85] as const;
const TRAZO_ARCO = "12.85 56.3";

const TRACK = "hsl(var(--border))";
const AVANCE = "hsl(var(--foreground))";
const APLICADA = "hsl(var(--fase-aplicada))";
const DETENIDA = "hsl(var(--fase-detenida))";
const FUERA = "hsl(var(--muted-foreground))";

function colorDeArco(fase: Fase): string {
  if (!fase.enCarril) return FUERA;
  if (fase.detenida) return DETENIDA;
  if (fase.kind === "aplicada") return APLICADA;
  return AVANCE;
}

interface Props {
  fase: Fase;
  /** 28 px en densidad cómoda/normal, 18 px en compacta. */
  size?: number;
}

export function FaseAnillo({ fase, size = 28 }: Props) {
  const color = colorDeArco(fase);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
      className="block flex-none"
      data-testid="fase-anillo"
      data-arcos={fase.arcos}
      data-tono={fase.enCarril ? (fase.detenida ? "detenida" : fase.kind) : "fuera"}
    >
      {/* El bisel no dibuja, mide: sin él, cuatro arcos sueltos flotan. */}
      <circle
        cx="14"
        cy="14"
        r="13"
        fill="none"
        stroke={TRACK}
        strokeWidth="0.7"
        opacity="0.55"
      />
      <g transform="rotate(-90 14 14)">
        {DESPLAZAMIENTOS.map((offset, i) => {
          const alcanzado = i < fase.arcos;
          return (
            <circle
              key={offset}
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke={alcanzado ? color : TRACK}
              strokeOpacity={alcanzado && !fase.enCarril ? 0.9 : 1}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={TRAZO_ARCO}
              strokeDashoffset={offset}
            />
          );
        })}
      </g>

      {fase.kind === "aplicada" && (
        <path
          d="M9.9 14.3 L12.8 17.2 L18.4 11.2"
          fill="none"
          stroke={APLICADA}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {fase.kind === "cancelada" && (
        <path
          d="M10.4 10.4 L17.6 17.6 M17.6 10.4 L10.4 17.6"
          fill="none"
          stroke={FUERA}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {fase.kind === "eliminada" && (
        <path
          d="M9.4 14 L18.6 14"
          fill="none"
          stroke={FUERA}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {fase.numero !== null && fase.kind !== "aplicada" && (
        <text
          x="14"
          y="17.9"
          textAnchor="middle"
          fill={fase.detenida ? DETENIDA : AVANCE}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          {fase.numero}
        </text>
      )}
    </svg>
  );
}
