import type { MotivoNoConfigurado, Periodo, UsuarioTablero } from "../../domain/entities";
import { dinero, duracionCorta, horaCorta, porcentaje, textoInicioSemana } from "../lib/format";
import { Link } from "react-router-dom";
import { PuntoEstado } from "../comunes/PuntoEstado";
import { SegmentoPeriodo } from "../comunes/SegmentoPeriodo";
import { RUTA_CONFIGURAR_USUARIO } from "./sinConfigurar";

const ESTADO = {
  activo: "Activo",
  sin_actividad: "Sin actividad",
  no_ha_empezado: "No ha empezado",
} as const;

const MOTIVO: Record<MotivoNoConfigurado, string> = {
  sin_zona: "falta la zona",
  sin_inicio_semana: "falta el inicio de semana",
  inicio_semana_futuro: "el inicio de semana aún no llega",
};

function Cifra({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] bg-dsm-tarjeta px-4 py-3.5 shadow-sm ring-1 ring-border">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {titulo}
      </span>
      <span className="font-serif text-2xl tracking-[-0.01em] tabular">{valor}</span>
      {nota && <span className="text-[11.5px] text-muted-foreground">{nota}</span>}
    </div>
  );
}

// Encabezado de la ficha: todas las cifras son las del usuario que mandó el API
// (D10, D14). El inicio de semana va con fecha y hora de la oficina
// (`textoInicioSemana`).
export function FichaEncabezado({
  usuario: u,
  periodo,
  hoy,
}: {
  usuario: UsuarioTablero;
  periodo: Periodo;
  hoy: string;
}) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            {u.zonaNombre ?? "Sin zona"}
          </div>
          <h1 className="font-serif text-[52px] font-light leading-none tracking-[-0.03em]">
            {u.nombre}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            {!u.configurado && u.motivoNoConfigurado && (
              <span className="rounded-full bg-dsm-ambar-fondo px-2.5 py-0.5 text-dsm-ambar">
                {`Sin configurar · ${MOTIVO[u.motivoNoConfigurado]}`}
              </span>
            )}
            {!u.configurado && (
              <Link
                to={RUTA_CONFIGURAR_USUARIO}
                className="text-dsm-marca underline-offset-2 hover:underline"
              >
                Configurar en Usuarios
              </Link>
            )}
            {u.inicioSemana && <span>{textoInicioSemana(u.inicioSemana, hoy)}</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-dsm-tarjeta px-2.5 py-0.5 text-foreground ring-1 ring-border">
              <PuntoEstado estado={u.estadoAhora} />
              {ESTADO[u.estadoAhora]}
            </span>
            {u.estadoAhora === "sin_actividad" && u.estadoDesde && (
              <span className="font-mono text-[11px]">{`desde ${horaCorta(u.estadoDesde)}`}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SegmentoPeriodo />
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {periodo === "hoy" ? "Cobrado hoy" : "Cobrado en la semana"}
          </span>
          <span className="font-serif text-[72px] leading-none tracking-[-0.03em] tabular">
            {dinero(u.pagos.importe)}
          </span>
        </div>
      </header>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
        <Cifra
          titulo="Horas activas"
          valor={u.minutosActivos > 0 ? duracionCorta(u.minutosActivos) : "—"}
        />
        <Cifra titulo="Pausas" valor={`${u.pausas.n} · ${duracionCorta(u.pausas.minutos)}`} />
        <Cifra titulo="Pagos" valor={String(u.pagos.n)} />
        <Cifra titulo="Visitas" valor={String(u.visitas)} />
        <Cifra
          titulo="Condonaciones"
          valor={`${u.condonaciones.n} · ${dinero(u.condonaciones.importe)}`}
        />
        <Cifra
          titulo="Faltan"
          valor={u.configurado ? `${u.coberturaPorSegmento.sinNada} de ${u.cobertura.total}` : "—"}
        />
        <Cifra
          titulo="% cobro semana"
          valor={porcentaje(u.cobro.pct)}
          nota={u.cobro.pct !== null ? `por cobrar ${dinero(u.cobro.falta)}` : undefined}
        />
      </div>
    </>
  );
}
