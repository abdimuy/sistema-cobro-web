import type { Turno } from "../../domain/entities";
import { formatHM } from "./time";

type Props = {
  turno: Turno;
};

// Burbuja is one message bubble (mockup `.bub`). Cliente turnos (entrante)
// render left/neutral; ia/humano turnos (saliente) render right/blue. A
// saliente turno tied to an actual send (mensajeRef set) gets an
// "aprobado" hint next to its timestamp.
export function Burbuja({ turno }: Props) {
  const isOut = turno.direccion === "saliente";
  const enviado = isOut && turno.mensajeRef;

  return (
    <div
      className={`bandeja-bub ${isOut ? "bandeja-bub-out" : "bandeja-bub-in"}`}
      data-testid="turno-bubble"
    >
      {turno.cuerpo}
      <div className="bandeja-bub-t tnum">
        {formatHM(turno.createdAt)}
        {enviado ? " · aprobado" : ""}
      </div>
    </div>
  );
}
