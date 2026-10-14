import type { ReactNode } from "react";
import type { Actividad } from "../../domain/entities";
import { diaDeNegocioDe, dinero, fechaCorta, horaCorta } from "../lib/format";
import { FORMA_COBRO_ETIQUETA, TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { TarjetaFilas, TarjetaNota, TarjetaSub, TarjetaTitulo } from "./InfoRapida";

const LARGO_NOTA = 70;

function cuando(iso: string): string {
  return `${fechaCorta(diaDeNegocioDe(iso))} ${horaCorta(iso)}`;
}

// TarjetaActividad: contenido del popover de una actividad (renglón, punto del
// eje, ícono). Todo sale del objeto Actividad del API, incluida la marca de
// captura tardía (`capturaTardia`, regla del servidor).
export function TarjetaActividad({ actividad: a }: { actividad: Actividad }) {
  const meta = TIPO_ACTIVIDAD_META[a.tipo];
  const resumen = a.visita
    ? a.visita.tipoVisita
    : a.pago
      ? `${a.tipo === "condonacion" ? "−" : ""}${dinero(a.pago.importe)}`
      : "";
  const filas: Array<readonly [string, ReactNode]> = [
    ["Cliente", a.clienteNombre],
    ["Venta", a.folio ?? "—"],
  ];
  if (a.visita) filas.push(["Estado", a.visita.etiqueta]);
  if (a.pago && a.tipo === "pago") filas.push(["Forma", FORMA_COBRO_ETIQUETA[a.pago.formaCobro]]);
  filas.push(["Registró", a.registradoPor.nombre]);
  filas.push(["GPS", a.conGps ? "con ubicación" : "sin ubicación"]);
  filas.push(["Fotos", a.numFotos > 0 ? String(a.numFotos) : "—"]);
  if (a.recibidoAt) {
    filas.push(["Llegó", `${cuando(a.recibidoAt)}${a.capturaTardia ? " · tarde" : ""}`]);
  }

  const nota = a.visita?.nota ?? null;
  const notaCorta =
    nota && nota.length > LARGO_NOTA ? `${nota.slice(0, LARGO_NOTA - 2)}…` : nota;

  return (
    <>
      <TarjetaTitulo>{`${meta.etiqueta} · ${resumen}`}</TarjetaTitulo>
      <TarjetaSub>{cuando(a.hora)}</TarjetaSub>
      <TarjetaFilas filas={filas} />
      {notaCorta && (
        <TarjetaNota>
          <i>{`“${notaCorta}”`}</i>
        </TarjetaNota>
      )}
    </>
  );
}
