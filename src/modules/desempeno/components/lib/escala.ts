import { enRelojDeNegocio } from "@/utils/tiempoDeNegocio";

// Eje horizontal de la línea de actividad: 7:00–20:00 en hora de la oficina
// (spec §5). Solo posiciona en pantalla lo que llegó del API.
export const HORA_INICIO_EJE = 7;
export const HORA_FIN_EJE = 20;
export const MARCAS_EJE = [7, 10, 13, 16, 19] as const;

const INICIO = HORA_INICIO_EJE * 60;
const FIN = HORA_FIN_EJE * 60;
const SPAN = FIN - INICIO;

export function minutosDelDia(iso: string): number {
  const reloj = enRelojDeNegocio(iso);
  return Number(reloj.slice(11, 13)) * 60 + Number(reloj.slice(14, 16));
}

/** Minutos del día → % del eje, pegado a los bordes. */
export function posicionMinutos(min: number): number {
  const c = Math.min(FIN, Math.max(INICIO, min));
  return ((c - INICIO) / SPAN) * 100;
}

export function posicion(iso: string): number {
  return posicionMinutos(minutosDelDia(iso));
}

export function ancho(desde: string, hasta: string): number {
  return Math.max(0, posicion(hasta) - posicion(desde));
}

/** "08:00" → % del eje. */
export function posicionHorario(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return posicionMinutos(h * 60 + m);
}
