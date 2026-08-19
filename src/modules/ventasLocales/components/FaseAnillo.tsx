import { cn } from "@/lib/utils";

import type { Fase } from "./fase";
import { trazoDeFase } from "./fasePaleta";

/**
 * El anillo de la fase: un aro de avance continuo sobre una pista. Sin cifra
 * adentro.
 *
 * A tamaño de tabla (26 px) un dígito centrado es una mancha, así que la cifra
 * vive en la celda, al lado del anillo.
 *
 * El avance tampoco se dibuja ya en cuatro arcos sueltos. Se renderizaron seis
 * variantes y se compararon al tamaño real: con huecos desiguales los arcos se
 * ven chuecos, con huecos iguales se ven como un aro punteado, y en cualquier
 * caso son tan cortos que leen como ruido. El aro continuo se lee al instante,
 * y por eso la geometría es un solo arco de `arcos / 4` de vuelta que arranca
 * en las doce y avanza en el sentido del reloj.
 *
 * Cuánto avanzó se sigue diciendo en `data-arcos` (cuartos alcanzados) y en la
 * cifra de la celda; el cruce a Microsip lo dice el estado aplicada, que es un
 * anillo cerrado con palomita.
 *
 * COLOR. El anillo ya no inventa su paleta: toma la de `fasePaleta`, la misma
 * que pinta la línea de tiempo del detalle y la cifra de la celda. El `<svg>`
 * lleva la clase de color de texto de la fase —`trazoDeFase`, la misma función
 * que consume la cifra— y los trazos van en `currentColor`, así que el tono —y
 * sus variantes de tema— se heredan sin repetir un solo valor hex.
 *
 * La pista es la excepción y sigue en `--fase-pista`: es el fondo contra el que
 * se lee el avance, no puede ser del color del avance. Va en ese token y no en
 * `--border` porque en tema oscuro el borde es #262626 sobre #0A0A0A y el
 * círculo entero desaparece, con lo que un "2 de 4" se lee como aro roto.
 * Los tokens del proyecto guardan sólo los canales HSL — de ahí el
 * `hsl(var(--token))`: `var(--token)` a secas no es un color válido y la
 * declaración se descarta.
 *
 * DETENIDA. No es un color. El ámbar que usaba es el de la fase *revisada*, así
 * que una revisada normal y una detenida se veían idénticas. Se distingue por
 * forma: el arco de avance conserva el color de su fase y lo que se puntea es
 * la pista, o sea lo que le falta.
 */

const RADIO = 11;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const GROSOR_ARCO = "2.6";

const PISTA = "hsl(var(--fase-pista))";

/**
 * La pista punteada de una venta detenida: catorce tramos alrededor del
 * círculo, con lo pintado algo más corto que el hueco.
 *
 * Catorce reparte la vuelta sin dejar costura visible y da un paso de ~4.94
 * unidades del viewBox. A 26 px eso son ~1.9 px pintados contra ~2.7 px vacíos
 * —punteado, no sucio— y a 18 px todavía ~1.3 contra ~1.8, que se sigue
 * separando de la pista continua.
 */
const SEGMENTOS_PISTA = 14;
const PASO_PISTA = CIRCUNFERENCIA / SEGMENTOS_PISTA;
const PISTA_PUNTEADA = `${(PASO_PISTA * 0.42).toFixed(2)} ${(PASO_PISTA * 0.58).toFixed(2)}`;

interface Props {
  fase: Fase;
  /** 26 px en densidad cómoda/normal, 18 px en compacta. */
  size?: number;
}

export function FaseAnillo({ fase, size = 26 }: Props) {
  const aplicada = fase.kind === "aplicada";
  const avance = (CIRCUNFERENCIA * fase.arcos) / 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
      className={cn("block flex-none", trazoDeFase(fase))}
      data-testid="fase-anillo"
      data-arcos={fase.arcos}
      data-tono={fase.enCarril ? (fase.detenida ? "detenida" : fase.kind) : "fuera"}
    >
      {aplicada ? (
        // Llegó a Microsip: el anillo se cierra.
        <circle
          cx="14"
          cy="14"
          r={RADIO}
          fill="none"
          stroke="currentColor"
          strokeWidth={GROSOR_ARCO}
        />
      ) : (
        <>
          <circle
            cx="14"
            cy="14"
            r={RADIO}
            fill="none"
            stroke={PISTA}
            strokeWidth={GROSOR_ARCO}
            // Detenida: lo que falta se puntea. El avance no cambia de color.
            strokeDasharray={fase.detenida ? PISTA_PUNTEADA : undefined}
            data-pista={fase.detenida ? "punteada" : "continua"}
          />
          <g transform="rotate(-90 14 14)">
            <circle
              cx="14"
              cy="14"
              r={RADIO}
              fill="none"
              stroke="currentColor"
              strokeOpacity={fase.enCarril ? 1 : 0.9}
              strokeWidth={GROSOR_ARCO}
              strokeLinecap="round"
              strokeDasharray={`${avance} ${CIRCUNFERENCIA}`}
            />
          </g>
        </>
      )}

      {aplicada && (
        <path
          d="M9.3 14.2 L12.6 17.5 L18.8 10.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {fase.kind === "cancelada" && (
        <path
          d="M10.4 10.4 L17.6 17.6 M17.6 10.4 L10.4 17.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {fase.kind === "eliminada" && (
        <path
          d="M9.4 14 L18.6 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
