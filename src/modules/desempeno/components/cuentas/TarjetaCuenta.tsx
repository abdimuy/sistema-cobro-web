import type { Cuenta } from "../../domain/entities";
import { diaDeNegocioDe, dinero2, fechaCorta, horaCorta } from "../lib/format";
import { etiquetaDeIdActividad } from "../lib/tipoActividadMeta";
import { TarjetaFilas, TarjetaNota, TarjetaTitulo } from "../comunes/InfoRapida";

function cuando(iso: string): string {
  return `${fechaCorta(diaDeNegocioDe(iso))} ${horaCorta(iso)}`;
}

// Popover del chip: etiqueta, detalle y qué movimiento lo determinó, todo del
// servidor (contrato §5).
export function TarjetaCuenta({ cuenta: c }: { cuenta: Cuenta }) {
  const determino = c.determinadoPor
    ? c.ultimaActividad && c.ultimaActividad.id === c.determinadoPor
      ? `${etiquetaDeIdActividad(c.determinadoPor)} · ${cuando(c.ultimaActividad.hora)}`
      : etiquetaDeIdActividad(c.determinadoPor)
    : "—";
  return (
    <>
      <TarjetaTitulo>{c.etiqueta}</TarjetaTitulo>
      <TarjetaNota>{c.detalle}</TarjetaNota>
      <TarjetaFilas
        filas={[
          ["Lo determinó", determino],
          ["Abonado en la semana", `${dinero2(c.abonoSemana)} de ${dinero2(c.parcialidad)}`],
          ["Última actividad", c.ultimaActividad ? cuando(c.ultimaActividad.hora) : "—"],
        ]}
      />
    </>
  );
}
