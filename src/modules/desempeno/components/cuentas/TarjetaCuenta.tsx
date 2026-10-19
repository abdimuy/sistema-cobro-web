import type { Cuenta } from "../../domain/entities";
import { diaDeNegocioDe, dinero2, fechaCorta, horaCorta } from "../lib/format";
import { etiquetaDeIdActividad } from "../lib/tipoActividadMeta";
import { TarjetaFilas, TarjetaNota, TarjetaTitulo } from "../comunes/InfoRapida";

function cuando(iso: string): string {
  return `${fechaCorta(diaDeNegocioDe(iso))} ${horaCorta(iso)}`;
}

// Popover del chip: etiqueta, detalle y qué movimiento lo determinó, todo del
// servidor (contrato §5). `compromiso` es el rótulo de la agenda del servidor
// (visitas P2); sin él no hay renglón.
export function TarjetaCuenta({ cuenta: c, compromiso = null }: { cuenta: Cuenta; compromiso?: string | null }) {
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
          ...(compromiso ? [["Compromiso", compromiso] as const] : []),
        ]}
      />
    </>
  );
}
