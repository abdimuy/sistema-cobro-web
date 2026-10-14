import type { HoraDelDia, Pausa, PuntoLinea, Tramo } from "../../domain/entities";
import { dinero, dinero2, duracion, horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { TarjetaFilas, TarjetaNota, TarjetaSub, TarjetaTitulo } from "../comunes/InfoRapida";

// Contenido de los popovers de la línea de actividad. Todo dato viene del API
// (D10): aquí solo se formatea.

function sub(texto: string, etiquetaDia?: string): string {
  return etiquetaDia ? `${texto} · ${etiquetaDia}` : texto;
}

/** 7 → "07:00". Solo rotula el intervalo [h, h+1) que define el contrato. */
function rotuloHora(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function TarjetaPausa({
  pausa,
  pausaMin,
  describir,
  etiquetaDia,
}: {
  pausa: Pausa;
  pausaMin: number;
  describir: (id: string) => string | null;
  etiquetaDia?: string;
}) {
  const antes = pausa.anteriorId ? describir(pausa.anteriorId) : null;
  const despues = pausa.enCurso
    ? "sigue sin actividad"
    : pausa.siguienteId
      ? describir(pausa.siguienteId)
      : null;
  return (
    <>
      <TarjetaTitulo>{`Pausa · ${duracion(pausa.minutos)}`}</TarjetaTitulo>
      <TarjetaSub>
        {sub(`${horaCorta(pausa.desde)}–${pausa.enCurso ? "ahora" : horaCorta(pausa.hasta)}`, etiquetaDia)}
      </TarjetaSub>
      <TarjetaFilas
        filas={[
          ["Antes", antes ?? "—"],
          ["Después", despues ?? "—"],
        ]}
      />
      <TarjetaNota>{`Hueco de ${pausaMin} min o más sin movimientos.`}</TarjetaNota>
    </>
  );
}

export function TarjetaTramo({ tramo, etiquetaDia }: { tramo: Tramo; etiquetaDia?: string }) {
  return (
    <>
      <TarjetaTitulo>{`${horaCorta(tramo.desde)}–${horaCorta(tramo.hasta)}`}</TarjetaTitulo>
      <TarjetaSub>{sub("Tramo de trabajo", etiquetaDia)}</TarjetaSub>
      <TarjetaFilas
        filas={[
          ["Pagos", `${tramo.pagos.n} · ${dinero(tramo.pagos.importe)}`],
          ["Visitas", String(tramo.visitas)],
          ["Condonaciones", String(tramo.condonaciones)],
          ["Clientes atendidos", String(tramo.clientes)],
        ]}
      />
    </>
  );
}

export function TarjetaHora({ hora, etiquetaDia }: { hora: HoraDelDia; etiquetaDia?: string }) {
  const vacia = hora.pagos === 0 && hora.visitas === 0 && hora.condonaciones === 0;
  return (
    <>
      <TarjetaTitulo>{`${rotuloHora(hora.hora)}–${rotuloHora(hora.hora + 1)}`}</TarjetaTitulo>
      {etiquetaDia && <TarjetaSub>{etiquetaDia}</TarjetaSub>}
      {vacia ? (
        <TarjetaNota>Sin movimientos en esta hora.</TarjetaNota>
      ) : (
        <TarjetaFilas
          filas={[
            ["Pagos", `${hora.pagos} · ${dinero(hora.importe)}`],
            ["Visitas", String(hora.visitas)],
            ["Condonaciones", String(hora.condonaciones)],
          ]}
        />
      )}
    </>
  );
}

// TarjetaPunto: cliente, monto (pagos y condonaciones) o resultado literal
// (visitas) y número de fotos, tal como llegan en `puntos` (contrato v2).
export function TarjetaPunto({ punto, etiquetaDia }: { punto: PuntoLinea; etiquetaDia?: string }) {
  const filas: Array<readonly [string, string]> = [["Cliente", punto.clienteNombre]];
  if (punto.tipo === "visita") {
    filas.push(["Resultado", punto.resultado ?? "—"]);
  } else if (punto.importe !== null) {
    filas.push(["Monto", dinero2(punto.importe)]);
  }
  filas.push(["Fotos", punto.numFotos > 0 ? String(punto.numFotos) : "—"]);
  return (
    <>
      <TarjetaTitulo>{`${TIPO_ACTIVIDAD_META[punto.tipo].etiqueta} · ${horaCorta(punto.hora)}`}</TarjetaTitulo>
      {etiquetaDia && <TarjetaSub>{etiquetaDia}</TarjetaSub>}
      <TarjetaFilas filas={filas} />
    </>
  );
}
