import type { UsuarioTablero } from "../../domain/entities";
import { diaDeNegocioDe, fechaCorta } from "../lib/format";

// Semana vencida (D19): el servidor la marca; aquí solo se rotula.
export function AvisoSemanaVencida({ u }: { u: UsuarioTablero }) {
  const inicio = u.inicioSemana ? fechaCorta(diaDeNegocioDe(u.inicioSemana)) : "sin fecha";
  const movimiento = u.ultimoMovimiento
    ? fechaCorta(diaDeNegocioDe(u.ultimoMovimiento.hora))
    : "sin movimiento en 92 días";
  return (
    <div
      role="status"
      className="rounded-full bg-dsm-ambar-fondo px-4 py-2 text-[13px] text-dsm-ambar"
    >
      {`Semana vencida · inicio ${inicio} · último movimiento ${movimiento}`}
    </div>
  );
}
