import type { Periodo, UsuarioTablero } from "../../domain/entities";
import type { Horario } from "../../application/ports/DesempenoPort";
import type { VistaLinea } from "../../presentation/preferencias";
import { diaDeNegocioDe, dinero, duracionCorta, fechaCorta, horaCorta, plural, porcentaje } from "../lib/format";
import { InfoRapida } from "../comunes/InfoRapida";
import { PuntoEstado } from "../comunes/PuntoEstado";
import { LineaActividad } from "../linea/LineaActividad";
import {
  TarjetaAhora,
  TarjetaCobro,
  TarjetaCuentas,
  TarjetaPagos,
  TarjetaPausas,
  TarjetaUsuario,
} from "./TarjetasTablero";

const CELDA = "border-y border-border bg-dsm-tarjeta px-2 py-3.5 align-middle";
const DISPARADOR = "cursor-help underline decoration-dotted decoration-foreground/25 underline-offset-[3px]";

function textoAhora(u: UsuarioTablero): string {
  if (u.estadoAhora === "activo") return "Activo";
  if (u.estadoAhora === "sin_actividad") return `Desde ${u.estadoDesde ? horaCorta(u.estadoDesde) : "—"}`;
  return "No ha empezado";
}

// TableroFila: un usuario configurado. El nombre, el estado y las celdas de
// cifras abren su popover con ratón o teclado (tabIndex 0, D17); los de la
// línea solo con ratón.
export function TableroFila({
  usuario: u,
  periodo,
  pausaMin,
  horario,
  vista,
  generadoAt,
  onAbrir,
}: {
  usuario: UsuarioTablero;
  periodo: Periodo;
  pausaMin: number;
  horario: Horario | null;
  vista: VistaLinea;
  generadoAt: string;
  onAbrir: (uid: string) => void;
}) {
  const hoy = diaDeNegocioDe(generadoAt);
  // Ancho de la barra con con_algo/total del API: solo dibujo; el número que se
  // lee es sin_nada tal como llega.
  const pct = u.cobertura.total > 0 ? (u.cobertura.conAlgo / u.cobertura.total) * 100 : 0;
  return (
    <tr
      tabIndex={0}
      aria-label={`Abrir ficha de ${u.nombre}`}
      onClick={(e) => {
        // Los popovers viven en un portal: React les propaga el clic a la fila
        // aunque no estén dentro de ella en el DOM.
        if (e.currentTarget.contains(e.target as Node)) onAbrir(u.uid);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onAbrir(u.uid);
        }
      }}
      className="group cursor-pointer outline-none [&>td]:transition-colors hover:[&>td]:bg-dsm-marca-fondo focus-visible:[&>td]:bg-dsm-marca-fondo"
    >
      <td className={`${CELDA} max-w-[220px] rounded-l-[14px] border-l pl-[18px]`}>
        <InfoRapida contenido={<TarjetaUsuario usuario={u} />}>
          <span tabIndex={0} className="cursor-help font-serif text-[17px] leading-tight">
            {u.nombre}
          </span>
        </InfoRapida>
        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{u.zonaNombre}</div>
      </td>
      <td className={CELDA}>
        <InfoRapida contenido={<TarjetaAhora usuario={u} pausaMin={pausaMin} />}>
          <span tabIndex={0} className="inline-flex cursor-help items-center gap-2 text-[13px]">
            <PuntoEstado estado={u.estadoAhora} />
            {textoAhora(u)}
          </span>
        </InfoRapida>
      </td>
      <td className={`${CELDA} w-[32%] min-w-[260px]`}>
        {u.lineas.length === 0 ? (
          <div className="relative">
            <LineaActividad
              linea={null}
              vista={vista}
              pausaMin={pausaMin}
              horario={horario}
              ahora={periodo === "hoy" ? generadoAt : null}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[12px] text-muted-foreground">
              Sin actividad
            </span>
          </div>
        ) : periodo === "hoy" ? (
          <LineaActividad
            linea={u.lineas[0]}
            vista={vista}
            pausaMin={pausaMin}
            horario={horario}
            ahora={u.lineas[0].dia === hoy ? generadoAt : null}
          />
        ) : (
          <div className="flex gap-1">
            {u.lineas.map((l) => (
              <div key={l.dia} className="min-w-0 flex-1">
                <LineaActividad
                  linea={l}
                  vista={vista}
                  pausaMin={pausaMin}
                  horario={horario}
                  ahora={l.dia === hoy ? generadoAt : null}
                  etiquetaDia={fechaCorta(l.dia)}
                />
                <span className="mt-1 block text-center font-mono text-[10px] text-muted-foreground">
                  {fechaCorta(l.dia)}
                </span>
              </div>
            ))}
          </div>
        )}
      </td>
      <td className={`${CELDA} text-right tabular`}>
        {u.minutosActivos > 0 ? duracionCorta(u.minutosActivos) : "—"}
      </td>
      <td className={`${CELDA} text-right tabular`}>
        {u.pausas.n > 0 ? (
          <InfoRapida contenido={<TarjetaPausas usuario={u} periodo={periodo} pausaMin={pausaMin} />}>
            <span tabIndex={0} className="inline-flex flex-col items-end">
              <b className={`font-medium ${DISPARADOR}`}>{duracionCorta(u.pausas.minutos)}</b>
              <span className={`text-[11px] ${u.pausas.enCurso ? "text-dsm-ambar" : "text-muted-foreground"}`}>
                {u.pausas.enCurso ? `${u.pausas.n} · en curso` : plural(u.pausas.n, "pausa", "pausas")}
              </span>
            </span>
          </InfoRapida>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className={`${CELDA} text-right tabular`}>
        <InfoRapida contenido={<TarjetaPagos usuario={u} periodo={periodo} />}>
          <span tabIndex={0} className="inline-flex flex-col items-end">
            <b className={`font-medium ${DISPARADOR}`}>{dinero(u.pagos.importe)}</b>
            <span className="text-[11px] text-muted-foreground">{plural(u.pagos.n, "pago", "pagos")}</span>
          </span>
        </InfoRapida>
      </td>
      <td className={`${CELDA} text-right tabular`}>{u.visitas}</td>
      <td className={`${CELDA} min-w-[150px]`}>
        <InfoRapida contenido={<TarjetaCuentas usuario={u} />}>
          <span tabIndex={0} className="block cursor-help">
            <span className="text-[13px]">
              <span className={DISPARADOR}>Faltan</span> <b className="font-medium">{u.coberturaPorSegmento.sinNada}</b>{" "}
              de {u.cobertura.total}
            </span>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
              <span className="block h-full bg-dsm-marca" style={{ width: `${pct}%` }} />
            </span>
          </span>
        </InfoRapida>
      </td>
      <td className={`${CELDA} rounded-r-[14px] border-r pr-[18px] text-right tabular`}>
        <InfoRapida contenido={<TarjetaCobro usuario={u} />}>
          <b tabIndex={0} className={`font-medium ${DISPARADOR}`}>
            {porcentaje(u.cobro.pct)}
          </b>
        </InfoRapida>
      </td>
    </tr>
  );
}
