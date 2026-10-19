import type { CompromisoDeVenta } from "../../domain/entities";
import { diaMes, pesosDeCentavos } from "./format";

// Rótulo de la columna "Compromiso" de Cuentas (visitas P2, Tarea 21). El
// estado lo deriva el servidor (GET /v2/visitas/agenda, spec §5.3.2); aquí no
// se compara el día con hoy ni se decide nada: cada estado tiene su texto.
// `cerrada_sin_cumplir` no se muestra (spec §5.3.2).

export type TonoCompromiso = "normal" | "cita" | "rojo" | "ok";

export const CLASE_TONO_COMPROMISO: Record<TonoCompromiso, string> = {
  normal: "text-foreground",
  cita: "text-dsm-violeta",
  rojo: "text-dsm-rojo",
  ok: "text-dsm-ok",
};

export function textoDeCompromiso(c: CompromisoDeVenta): string | null {
  const dia = diaMes(c.dia);
  const esCita = c.tipo === "cita";
  switch (c.estado) {
    case "vigente_futura":
    case "vigente_hoy":
      if (esCita) return c.hora ? `Cita ${dia} ${c.hora}` : `Cita ${dia}`;
      return c.montoCentavos === null ? `Promesa ${dia}` : `Promesa ${dia} · ${pesosDeCentavos(c.montoCentavos)}`;
    case "incumplida":
      return esCita ? `Cita incumplida ${dia}` : `Incumplida ${dia}`;
    case "cumplida":
    case "cita_cumplida":
      return esCita ? `Cita cumplida ${dia}` : `Cumplida ${dia}`;
    case "cerrada_sin_cumplir":
      return null;
  }
}

export function tonoDeCompromiso(c: CompromisoDeVenta): TonoCompromiso {
  switch (c.estado) {
    case "incumplida":
      return "rojo";
    case "cumplida":
    case "cita_cumplida":
      return "ok";
    default:
      return c.tipo === "cita" ? "cita" : "normal";
  }
}
