import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronsUpDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Periodo } from "../../domain/entities";
import { useTablero } from "../../presentation/hooks/useTablero";
import { useUltimosMovimientos92Dias } from "../../presentation/hooks/useUltimosMovimientos92Dias";
import { usePreferencias } from "../../presentation/context/usePreferencias";
import { diaDeNegocioDe, fechaLarga, horaCorta } from "../lib/format";
import { EJE_POR_OMISION, escalaDe } from "../lib/escala";
import { AvisoPantallaAngosta, ErrorConReintento, EstadoVacio } from "../comunes/Estados";
import { TableroToolbar } from "./TableroToolbar";
import { TableroFila } from "./TableroFila";
import { FilaSinConfigurar } from "./FilaSinConfigurar";
import { FilaVencida } from "./FilaVencida";
import { FilaEsqueleto } from "./FilaEsqueleto";
import { InfoRapida } from "../comunes/InfoRapida";
import {
  CLAVES_CON_PROMEDIO,
  filtrarUsuarios,
  ORDEN_TABLERO_INICIAL,
  ordenarUsuarios,
  zonasDelTablero,
  siguienteOrden,
  type ClaveOrdenTablero,
  type OrdenTablero,
} from "./ordenTablero";

const COLUMNAS = 9;
const FILAS_ESQUELETO = 8;
const ESPERA_MENSAJE_MS = 1000;

function Encabezado({
  clave,
  texto,
  orden,
  onOrdenar,
  derecha,
  periodo,
}: {
  clave: ClaveOrdenTablero;
  texto: string;
  orden: OrdenTablero;
  onOrdenar: (c: ClaveOrdenTablero) => void;
  derecha?: boolean;
  periodo: Periodo;
}) {
  const activa = orden.clave === clave;
  const Icono = activa ? (orden.dir === 1 ? ArrowUp : ArrowDown) : ChevronsUpDown;
  const porPromedio = periodo === "semana" && CLAVES_CON_PROMEDIO.includes(clave);
  const boton = (
    <button
      type="button"
      onClick={() => onOrdenar(clave)}
      className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
    >
      {texto}
      <Icono aria-hidden className={cn("h-3 w-3", !activa && "opacity-40")} />
    </button>
  );
  return (
    <th
      aria-sort={activa ? (orden.dir === 1 ? "ascending" : "descending") : "none"}
      className={cn("h-7 px-2 font-normal", derecha ? "text-right" : "text-left")}
    >
      {porPromedio ? <InfoRapida contenido="Ordena por promedio diario">{boton}</InfoRapida> : boton}
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
  const { tablero: recibido, isLoading, error, refresh } = useTablero();
  const { vista, horario, periodo } = usePreferencias();
  const [q, setQ] = useState("");
  // La zona elegida vive en la URL (`?zona=`): se conserva al abrir una ficha y volver.
  const [params, setParams] = useSearchParams();
  const zonaPedida = params.get("zona");
  const [orden, setOrden] = useState<OrdenTablero>(ORDEN_TABLERO_INICIAL);
  const [verVencidas, setVerVencidas] = useState(false);

  // Carga honesta (D23, Review Focus 4): sólo se pintan cifras cuyo `periodo`
  // coincide con el elegido; la respuesta de otro periodo se trata como ausente.
  const tablero = recibido && recibido.periodo === periodo ? recibido : null;
  const cargando = tablero === null && error === null;
  const [lento, setLento] = useState(false);
  useEffect(() => {
    if (!cargando) {
      setLento(false);
      return undefined;
    }
    const t = window.setTimeout(() => setLento(true), ESPERA_MENSAJE_MS);
    return () => window.clearTimeout(t);
  }, [cargando, periodo]);

  const zonas = useMemo(() => zonasDelTablero(tablero?.usuarios ?? []), [tablero]);
  // Una zona que ya no está entre las filas cargadas equivale a "Todas".
  const zona = zonaPedida !== null && zonas.includes(zonaPedida) ? zonaPedida : null;
  const onZona = (z: string | null) =>
    setParams(
      (previos) => {
        const nuevos = new URLSearchParams(previos);
        if (z === null) nuevos.delete("zona");
        else nuevos.set("zona", z);
        return nuevos;
      },
      { replace: true },
    );

  const eje = tablero?.eje ?? EJE_POR_OMISION;
  const escala = useMemo(() => escalaDe(eje), [eje]);
  const configurados = useMemo(
    () =>
      ordenarUsuarios(
        filtrarUsuarios(tablero?.usuarios.filter((u) => u.configurado && !u.semanaVencida) ?? [], q, zona),
        orden,
        periodo,
      ),
    [tablero, q, zona, orden, periodo],
  );
  const vencidas = useMemo(
    () => filtrarUsuarios(tablero?.usuarios.filter((u) => u.configurado && u.semanaVencida) ?? [], q, zona),
    [tablero, q, zona],
  );
  // Contrato pulido 2 §4: la fecha de 92 días de las vencidas se pide al abrir
  // "Ver N", con TODAS las vencidas (sin el filtro de búsqueda, para no pedir
  // otra vez en cada tecla). Cerrado no se pide nada.
  const uidsVencidas = useMemo(
    () => tablero?.usuarios.filter((u) => u.configurado && u.semanaVencida).map((u) => u.uid) ?? [],
    [tablero],
  );
  const { movimientoDe } = useUltimosMovimientos92Dias(
    verVencidas && uidsVencidas.length > 0 ? uidsVencidas : null,
  );
  const sinConfigurar = useMemo(
    () => filtrarUsuarios(tablero?.usuarios.filter((u) => !u.configurado) ?? [], q, zona),
    [tablero, q, zona],
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
              : lento && !error
                ? periodo === "semana"
                  ? "Cargando semana…"
                  : "Cargando hoy…"
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
      <TableroToolbar q={q} onQ={setQ} zonas={zonas} zona={zona} onZona={onZona} />

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
        <ErrorConReintento titulo="No se pudo cargar" mensaje={error.message} onReintentar={refresh} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <Encabezado periodo={periodo} clave="nombre" texto="Cobrador" orden={orden} onOrdenar={onOrdenar} />
                <Encabezado periodo={periodo} clave="ahora" texto="Ahora" orden={orden} onOrdenar={onOrdenar} />
                <th className="relative h-7 px-2 text-left font-normal">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    {tablero?.periodo === "semana" ? "Jornada por día" : `Jornada ${eje.desdeHora}–${eje.hastaHora} h`}
                  </span>
                  {tablero?.periodo !== "semana" && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-3">
                      {escala.marcas.map((h) => (
                        <span
                          key={h}
                          className="absolute -translate-x-1/2 font-mono text-[9.5px] text-muted-foreground"
                          style={{ left: `${escala.posicionMinutos(h * 60)}%` }}
                        >
                          {h}
                        </span>
                      ))}
                    </span>
                  )}
                </th>
                <Encabezado periodo={periodo} clave="horas" texto="Horas activas" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado periodo={periodo} clave="pausas" texto="Pausas" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado periodo={periodo} clave="pagos" texto="Pagos" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado periodo={periodo} clave="visitas" texto="Visitas" orden={orden} onOrdenar={onOrdenar} derecha />
                <Encabezado periodo={periodo} clave="faltan" texto="Cuentas semana" orden={orden} onOrdenar={onOrdenar} />
                <Encabezado periodo={periodo} clave="cobro" texto="% cobro" orden={orden} onOrdenar={onOrdenar} derecha />
              </tr>
            </thead>
            <tbody>
              {!tablero &&
                !error &&
                Array.from({ length: FILAS_ESQUELETO }).map((_, i) => <FilaEsqueleto key={i} />)}
              {tablero &&
                configurados.map((u) => (
                  <TableroFila
                    key={u.uid}
                    usuario={u}
                    periodo={tablero.periodo}
                    eje={tablero.eje}
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
              {tablero && vencidas.length > 0 && (
                <tr>
                  <td colSpan={COLUMNAS} className="pt-2">
                    <button
                      type="button"
                      aria-expanded={verVencidas}
                      onClick={() => setVerVencidas((v) => !v)}
                      className="text-[13px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      {`${verVencidas ? "Ocultar" : "Ver"} ${vencidas.length} sin actividad reciente`}
                    </button>
                  </td>
                </tr>
              )}
              {tablero &&
                verVencidas &&
                vencidas.map((u) => (
                  <FilaVencida
                    key={u.uid}
                    usuario={u}
                    movimiento={movimientoDe(u.uid)}
                    hoy={tablero.hoy}
                    columnas={COLUMNAS}
                    onAbrir={onAbrirUsuario}
                  />
                ))}
              {tablero && tablero.usuarios.length === 0 && (
                <tr>
                  <td colSpan={COLUMNAS}>
                    <EstadoVacio titulo="No hay usuarios para mostrar" />
                  </td>
                </tr>
              )}
              {tablero && tablero.usuarios.length > 0 && configurados.length + vencidas.length + sinConfigurar.length === 0 && (
                <tr>
                  <td colSpan={COLUMNAS}>
                    <EstadoVacio
                      titulo={
                        q.trim() === ""
                          ? `No hay cobradores en la zona “${zona}”`
                          : zona
                            ? `Nadie coincide con “${q}” en la zona “${zona}”`
                            : `Nadie coincide con “${q}”`
                      }
                      detalle={zona ? "Cambia la zona o la búsqueda." : "Busca por nombre, zona o correo."}
                    />
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
