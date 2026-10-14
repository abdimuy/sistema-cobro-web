import type { Periodo, UsuarioTablero } from "../../domain/entities";
import { diaDeNegocioDe, dinero, duracionCorta, fechaCorta, horaCorta, plural, porcentaje } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import {
  TarjetaBarras,
  TarjetaFilas,
  TarjetaLista,
  TarjetaNota,
  TarjetaSeparador,
  TarjetaSub,
  TarjetaTitulo,
} from "../comunes/InfoRapida";

// Contenido de los popovers del tablero. Todas las cifras llegan del API por
// usuario (D10, D14); aquí solo se formatean.

function cuando(iso: string | null): string {
  return iso ? `${fechaCorta(diaDeNegocioDe(iso))} ${horaCorta(iso)}` : "—";
}

const DEL_PERIODO: Record<Periodo, string> = { hoy: "de hoy", semana: "de la semana" };

export function TarjetaUsuario({ usuario: u }: { usuario: UsuarioTablero }) {
  return (
    <>
      <TarjetaTitulo>{u.nombre}</TarjetaTitulo>
      <TarjetaSub>{u.email}</TarjetaSub>
      <TarjetaFilas
        filas={[
          ["Zona", u.zonaNombre ?? "—"],
          ["Inicio de semana", cuando(u.inicioSemana)],
          ["Ventas en su universo", String(u.ventasUniverso)],
          ["Primera actividad", cuando(u.primeraActividad)],
          ["Última actividad", cuando(u.ultimaActividad)],
        ]}
      />
    </>
  );
}

export function TarjetaAhora({ usuario: u, pausaMin }: { usuario: UsuarioTablero; pausaMin: number }) {
  if (u.estadoAhora === "no_ha_empezado" || !u.ultima) {
    return (
      <>
        <TarjetaTitulo>No ha empezado</TarjetaTitulo>
        <TarjetaSub>{`última actividad: ${cuando(u.ultimaActividad)}`}</TarjetaSub>
      </>
    );
  }
  const titulo =
    u.estadoAhora === "activo"
      ? "Activo"
      : `Sin actividad desde ${u.estadoDesde ? horaCorta(u.estadoDesde) : "—"}`;
  return (
    <>
      <TarjetaTitulo>{titulo}</TarjetaTitulo>
      <TarjetaFilas
        filas={[
          ["Último", TIPO_ACTIVIDAD_META[u.ultima.tipo].etiqueta],
          ["Cliente", u.ultima.clienteNombre],
          ["Hora", horaCorta(u.ultima.hora)],
        ]}
      />
      {u.estadoAhora === "sin_actividad" && (
        <TarjetaNota>{`Cuenta como pausa: pasaron ${pausaMin} min o más sin movimientos.`}</TarjetaNota>
      )}
    </>
  );
}

export function TarjetaPausas({
  usuario: u,
  periodo,
  pausaMin,
}: {
  usuario: UsuarioTablero;
  periodo: Periodo;
  pausaMin: number;
}) {
  const filas: Array<readonly [string, string]> = u.lineas.flatMap((l) =>
    l.pausas.map(
      (p) =>
        [
          `${periodo === "semana" ? `${fechaCorta(l.dia)} · ` : ""}${horaCorta(p.desde)}–${p.enCurso ? "ahora" : horaCorta(p.hasta)}`,
          `${duracionCorta(p.minutos)}${p.enCurso ? " · en curso" : ""}`,
        ] as const,
    ),
  );
  return (
    <>
      <TarjetaTitulo>{`Pausas ${DEL_PERIODO[periodo]}`}</TarjetaTitulo>
      <TarjetaSub>{`huecos de ${pausaMin} min o más`}</TarjetaSub>
      <TarjetaLista filas={filas} />
    </>
  );
}

export function TarjetaPagos({ usuario: u, periodo }: { usuario: UsuarioTablero; periodo: Periodo }) {
  const c = (n: number, importe: string) => `${n} · ${dinero(importe)}`;
  return (
    <>
      <TarjetaTitulo>{`Pagos ${DEL_PERIODO[periodo]}`}</TarjetaTitulo>
      <TarjetaSub>{`${plural(u.pagos.n, "pago", "pagos")} · ${dinero(u.pagos.importe)}`}</TarjetaSub>
      <TarjetaFilas
        filas={[
          ["Efectivo", c(u.pagosPorForma.efectivo.n, u.pagosPorForma.efectivo.importe)],
          ["Transferencia", c(u.pagosPorForma.transferencia.n, u.pagosPorForma.transferencia.importe)],
          ["Cheque", c(u.pagosPorForma.cheque.n, u.pagosPorForma.cheque.importe)],
        ]}
      />
      <TarjetaSeparador />
      <TarjetaFilas
        filas={[
          ["Condonaciones (aparte)", c(u.condonaciones.n, u.condonaciones.importe)],
          ["Sin aplicar", c(u.noAplicados.n, u.noAplicados.importe)],
        ]}
      />
    </>
  );
}

export function TarjetaCuentas({ usuario: u }: { usuario: UsuarioTablero }) {
  const s = u.coberturaPorSegmento;
  const total = u.cobertura.total;
  return (
    <>
      <TarjetaTitulo>Cuentas de la semana</TarjetaTitulo>
      <TarjetaSub>{`${total} ventas en su universo`}</TarjetaSub>
      <TarjetaBarras
        filas={[
          { etiqueta: "Sin visitar", n: s.sinVisitar, total, clase: "bg-foreground/70" },
          { etiqueta: "Volver", n: s.volver, total, clase: "bg-dsm-ambar" },
          { etiqueta: "Después", n: s.despues, total, clase: "bg-dsm-violeta" },
          { etiqueta: "Pagados", n: s.pagados, total, clase: "bg-dsm-ok" },
          { etiqueta: "Sin nada", n: s.sinNada, total, clase: "bg-dsm-rojo" },
        ]}
      />
      <TarjetaNota>Semana del usuario, desde su inicio de semana.</TarjetaNota>
    </>
  );
}

// TarjetaCobro: "Falta por cobrar" es `cobro.falta` del servidor (contrato v2);
// el escritorio no resta esperado − cobrado (D10).
export function TarjetaCobro({ usuario: u }: { usuario: UsuarioTablero }) {
  return (
    <>
      <TarjetaTitulo>{`Cobro de la semana · ${porcentaje(u.cobro.pct)}`}</TarjetaTitulo>
      <TarjetaSub>{`desde ${cuando(u.inicioSemana)}`}</TarjetaSub>
      <TarjetaFilas
        filas={[
          ["Cobrado", dinero(u.cobro.cobrado)],
          ["Esperado", dinero(u.cobro.esperado)],
          ["Falta por cobrar", dinero(u.cobro.falta)],
        ]}
      />
    </>
  );
}
