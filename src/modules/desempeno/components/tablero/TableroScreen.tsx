import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTablero } from "../../presentation/hooks/useTablero";
import { usePreferencias } from "../../presentation/context/usePreferencias";
import { diaDeNegocioDe, fechaLarga, horaCorta } from "../lib/format";
import { MARCAS_EJE, posicionMinutos } from "../lib/escala";
import { AvisoPantallaAngosta, ErrorConReintento, EstadoVacio, FilasCargando } from "../comunes/Estados";
import { TableroToolbar } from "./TableroToolbar";
import { TableroFila } from "./TableroFila";
import { FilaSinConfigurar } from "./FilaSinConfigurar";
import {
  filtrarUsuarios,
  ORDEN_TABLERO_INICIAL,
  ordenarUsuarios,
  siguienteOrden,
  type ClaveOrdenTablero,
  type OrdenTablero,
} from "./ordenTablero";

const COLUMNAS = 9;

function Encabezado({
  clave,
  texto,
  orden,
  onOrdenar,
  derecha,
}: {
  clave: ClaveOrdenTablero;
  texto: string;
  orden: OrdenTablero;
  onOrdenar: (c: ClaveOrdenTablero) => void;
  derecha?: boolean;
}) {
  const activa = orden.clave === clave;
  const Icono = activa ? (orden.dir === 1 ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th className={cn("h-7 px-2 font-normal", derecha ? "text-right" : "text-left")}>
      <button
        type="button"
        onClick={() => onOrdenar(clave)}
        className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      >
        {texto}
        <Icono aria-hidden className={cn("h-3 w-3", !activa && "opacity-40")} />
      </button>
    </th>
  );
}

// TableroScreen: Inicio para quien tiene DESEMPENO_COBRADORES. Una fila por
// usuario, sin totales del equipo (D14). Se actualiza cada minuto; si una
// actualización falla se quedan las filas y aparece un aviso.
export function TableroScreen({
  onAbrirUsuario,
  puedeConfigurar,
}: {
  onAbrirUsuario: (uid: string) => void;
  puedeConfigurar: boolean;
}) {
  const { tablero, isLoading, error, refresh } = useTablero();
  const { vista, horario } = usePreferencias();
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<OrdenTablero>(ORDEN_TABLERO_INICIAL);

  const configurados = useMemo(
    () => ordenarUsuarios(filtrarUsuarios(tablero?.usuarios.filter((u) => u.configurado) ?? [], q), orden),
    [tablero, q, orden],
  );
  const sinConfigurar = useMemo(
    () => filtrarUsuarios(tablero?.usuarios.filter((u) => !u.configurado) ?? [], q),
    [tablero, q],
  );
  const onOrdenar = (c: ClaveOrdenTablero) => setOrden((o) => siguienteOrden(o, c));

  return (
    <section className="flex min-h-full flex-col gap-6 bg-dsm-canvas px-10 pb-24 pt-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[54px] font-light leading-none tracking-[-0.03em]">
            Desempeño de cobradores
          </h1>
          <p className="mt-2 min-h-[1.5em] text-[15px] text-muted-foreground">
            {tablero
              ? tablero.periodo === "hoy"
                ? `${fechaLarga(diaDeNegocioDe(tablero.generadoAt))} · ${horaCorta(tablero.generadoAt)}`
                : "Semana en curso · cada quien desde su inicio de semana"
              : null}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className={cn("h-2 w-2 rounded-full bg-dsm-ok", isLoading && "animate-pulse")} />
          {tablero && <span>{`Actualizado ${horaCorta(tablero.generadoAt)}`}</span>}
          <button
            type="button"
            aria-label="Actualizar"
            onClick={refresh}
            className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted"
          >
            <RefreshCw aria-hidden className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </header>

      <AvisoPantallaAngosta />
      <TableroToolbar q={q} onQ={setQ} />

      {error && tablero && (
        <div
          role="status"
          className="flex items-center justify-between rounded-full bg-dsm-ambar-fondo px-4 py-2 text-[13px] text-dsm-ambar"
        >
          {`No se pudo actualizar. Se muestran los datos de las ${horaCorta(tablero.generadoAt)}.`}
          <button type="button" onClick={refresh} className="underline underline-offset-2">
            Reintentar
          </button>
        </div>
      )}

      {error && !tablero ? (
        <ErrorConReintento titulo="No se pudo cargar el tablero" mensaje={error.message} onReintentar={refresh} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <Encabezado clave="zona" texto="Cobrador" orden={orden} onOrdenar={onOrdenar} />
                <Encabezado clave="ahora" texto="Ahora" orden={orden} onOrdenar={onOrdenar} />
                <th className="relative h-7 px-2 text-left font-normal">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    {tablero?.periodo === "semana" ? "Jornada por día" : "Jornada 7–20 h"}
                  </span>
                  {tablero?.periodo !== "semana" && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-3">
                      {MARCAS_EJE.map((h) => (
                        <span
                          key={h}
                          className="absolute -translate-x-1/2 font-mono text-[9.5px] text-muted-foreground"
                          style={{ left: `${posicionMinutos(h * 60)}%` }}
                        >
                          {h}
                        </span>
                      ))}
                    </span>
                  )}
                </th>
                <Encabezado clave="horas" texto="Horas activas" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado clave="pausas" texto="Pausas" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado clave="pagos" texto="Pagos" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado clave="visitas" texto="Visitas" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado clave="faltan" texto="Cuentas semana" orden={orden} onOrdenar={onOrdenar} />
                <Encabezado clave="cobro" texto="% cobro" orden={orden} onOrdenar={onOrdenar} derecha />
              </tr>
            </thead>
            <tbody>
              {isLoading && !tablero && <FilasCargando filas={5} columnas={COLUMNAS} />}
              {tablero &&
                configurados.map((u) => (
                  <TableroFila
                    key={u.uid}
                    usuario={u}
                    periodo={tablero.periodo}
                    pausaMin={tablero.pausaMin}
                    horario={horario}
                    vista={vista}
                    generadoAt={tablero.generadoAt}
                    onAbrir={onAbrirUsuario}
                  />
                ))}
              {tablero &&
                sinConfigurar.map((u) => (
                  <FilaSinConfigurar key={u.uid} usuario={u} puedeConfigurar={puedeConfigurar} columnas={COLUMNAS} />
                ))}
              {tablero && tablero.usuarios.length === 0 && (
                <tr>
                  <td colSpan={COLUMNAS}>
                    <EstadoVacio titulo="No hay usuarios para mostrar" />
                  </td>
                </tr>
              )}
              {tablero && tablero.usuarios.length > 0 && configurados.length + sinConfigurar.length === 0 && (
                <tr>
                  <td colSpan={COLUMNAS}>
                    <EstadoVacio titulo={`Nadie coincide con “${q}”`} detalle="Busca por nombre, zona o correo." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
