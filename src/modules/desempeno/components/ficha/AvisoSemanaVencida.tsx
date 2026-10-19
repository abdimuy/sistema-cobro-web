import type { UsuarioFicha } from "../../domain/entities";
import { diaDeNegocioDe, fechaCorta } from "../lib/format";

// Semana vencida (D19): el servidor la marca; aquí solo se rotula. El dato es
// el de la ficha (1, 7 y 92 días): null = sin movimiento en 92 días.
export function AvisoSemanaVencida({ u }: { u: UsuarioFicha }) {
  const inicio = u.inicioSemana ? fechaCorta(diaDeNegocioDe(u.inicioSemana)) : "sin fecha";
  const movimiento = u.ultimoMovimiento92Dias
    ? fechaCorta(diaDeNegocioDe(u.ultimoMovimiento92Dias.hora))
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
