import { enRelojDeNegocio } from "@/utils/tiempoDeNegocio";
import type { Eje } from "../../domain/entities";

// Eje horizontal de la línea de actividad. Su rango lo manda el servidor en
// cada respuesta (`eje`, contrato v2.2 / E-INF-018); aquí solo se ubica en
// pantalla lo que llegó del API. EJE_POR_OMISION es únicamente el valor de
// partida de los tests y de la pantalla antes de que llegue el primer dato.
export const EJE_POR_OMISION: Eje = { desdeHora: 7, hastaHora: 20 };

export type Escala = {
  /** Instante ISO → % del eje, pegado a los bordes. */
  posicion(iso: string): number;
  /** Minutos del día → % del eje, pegado a los bordes. */
  posicionMinutos(min: number): number;
  ancho(desde: string, hasta: string): number;
  /** "08:00" → % del eje. */
  posicionHorario(hhmm: string): number;
  /** Horas con línea guía: cada 3 h desde el inicio, más la última hora. */
  marcas: readonly number[];
};

export function minutosDelDia(iso: string): number {
  const reloj = enRelojDeNegocio(iso);
  return Number(reloj.slice(11, 13)) * 60 + Number(reloj.slice(14, 16));
}

export function escalaDe(eje: Eje): Escala {
  const inicio = eje.desdeHora * 60;
  const fin = eje.hastaHora * 60;
  const span = fin - inicio;
  const posicionMinutos = (min: number): number => {
    const c = Math.min(fin, Math.max(inicio, min));
    return ((c - inicio) / span) * 100;
  };
  const posicion = (iso: string): number => posicionMinutos(minutosDelDia(iso));
  const marcas: number[] = [];
  for (let h = eje.desdeHora; h < eje.hastaHora; h += 3) marcas.push(h);
  const ultima = eje.hastaHora - 1;
  if (ultima > eje.desdeHora && !marcas.includes(ultima)) marcas.push(ultima);
  return {
    posicion,
    posicionMinutos,
    ancho: (desde, hasta) => Math.max(0, posicion(hasta) - posicion(desde)),
    posicionHorario: (hhmm) => {
      const [h, m] = hhmm.split(":").map(Number);
      return posicionMinutos(h * 60 + m);
    },
    marcas,
  };
}
