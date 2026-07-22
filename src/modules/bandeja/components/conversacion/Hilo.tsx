import { Fragment } from "react";
import type { Turno } from "../../domain/entities";
import { Burbuja } from "./Burbuja";
import { dayLabel } from "./time";

type Props = {
  turnos: Turno[];
};

// Hilo is the message thread (mockup `.thread`): day separators + bubbles,
// in the order the backend already returns them (chronological, oldest
// first). Separators and bubbles must stay DIRECT children of the flex
// column (`.bandeja-thread`) for align-self (left/right) to work — hence
// Fragment, not a wrapping <div>, per turno.
export function Hilo({ turnos }: Props) {
  if (turnos.length === 0) {
    return (
      <div className="bandeja-thread">
        <p className="bandeja-empty">Aún no hay mensajes</p>
      </div>
    );
  }

  let lastDay = "";

  return (
    <div className="bandeja-thread">
      {turnos.map((turno, i) => {
        const label = dayLabel(turno.createdAt);
        const showSep = label !== lastDay;
        lastDay = label;
        return (
          <Fragment key={`${turno.createdAt}-${i}`}>
            {showSep && <div className="bandeja-daysep">{label}</div>}
            <Burbuja turno={turno} />
          </Fragment>
        );
      })}
    </div>
  );
}
