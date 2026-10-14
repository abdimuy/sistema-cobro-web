import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  FILTROS_ACTIVIDAD_INICIALES,
  type Actividad,
  type FiltrosActividad,
  type OrdenActividad,
  type UsuarioTablero,
} from "../../domain/entities";
import { useActividad, useCatalogos } from "../../presentation/hooks/useActividad";
import { useColumnasActividad } from "../../presentation/hooks/useColumnasActividad";
import { useVistasGuardadas } from "../../presentation/hooks/useVistasGuardadas";
import { dinero, entero, plural } from "../lib/format";
import { ErrorConReintento, EstadoVacio } from "../comunes/Estados";
import type { AbrirVenta } from "../jornada/describirActividades";
import { FiltrosActividadBar } from "./FiltrosActividadBar";
import { VistasActividad } from "./VistasActividad";
import { MenuColumnas } from "./MenuColumnas";
import { TablaActividad } from "./TablaActividad";
import { AGRUPACIONES, ORDEN_PARA_AGRUPAR, type Agrupacion } from "./agrupar";
import { VISTAS_PREDEFINIDAS } from "./vistasPredefinidas";

export type ActividadTabProps = {
  usuario: UsuarioTablero;
  opcionesRegistro: ReadonlyArray<{ valor: string; etiqueta: string }>;
  onAbrirActividad: (a: Actividad) => void;
  /** Abre el detalle de venta de Clientes con el `docto_pv_id` del API. */
  onAbrirVenta?: AbrirVenta;
  renderFotos?: (a: Actividad) => ReactNode;
};

// Actividad de TODA la zona del usuario, cualquier registrador (contrato §4).
// Sin exportación a Excel en esta fase (Apéndice A del plan).
export function ActividadTab({
  usuario,
  opcionesRegistro,
  onAbrirActividad,
  onAbrirVenta,
  renderFotos,
}: ActividadTabProps) {
  const [filtros, setFiltros] = useState<FiltrosActividad>(FILTROS_ACTIVIDAD_INICIALES);
  const [vistaActiva, setVistaActiva] = useState<string | null>("todo");
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("");
  const { columnas, alternar, fijar } = useColumnasActividad();
  const { vistas, guardar, eliminar } = useVistasGuardadas();
  const { catalogos } = useCatalogos();
  const actividad = useActividad(usuario.uid, filtros);

  const cambiar = useCallback((parcial: Partial<FiltrosActividad>) => {
    setFiltros((f) => ({ ...f, ...parcial }));
    setVistaActiva(null);
  }, []);

  const predefinidas = useMemo(
    () => VISTAS_PREDEFINIDAS.map((v) => ({ id: v.id, nombre: v.nombre(usuario.nombre) })),
    [usuario.nombre],
  );

  const aplicarVista = (id: string) => {
    const predefinida = VISTAS_PREDEFINIDAS.find((v) => v.id === id);
    if (predefinida) {
      setFiltros((f) => predefinida.filtros(usuario.uid, f));
    } else {
      const guardada = vistas.find((v) => v.id === id);
      if (!guardada) return;
      setFiltros({ ...FILTROS_ACTIVIDAD_INICIALES, ...guardada.filtros });
      fijar(guardada.columnas);
    }
    setVistaActiva(id);
  };

  // Ordenar por otra columna deshace la agrupación: los grupos solo tienen
  // sentido con el orden que los junta.
  const ordenar = (orden: OrdenActividad) => {
    if (agrupacion !== "" && ORDEN_PARA_AGRUPAR[agrupacion] !== orden) setAgrupacion("");
    setFiltros((f) =>
      f.orden === orden
        ? { ...f, dir: f.dir === "asc" ? "desc" : "asc" }
        : { ...f, orden, dir: orden === "hora" || orden === "monto" ? "desc" : "asc" },
    );
  };

  const agrupar = (g: Agrupacion) => {
    setAgrupacion(g);
    if (g !== "") {
      setFiltros((f) => ({ ...f, orden: ORDEN_PARA_AGRUPAR[g], dir: g === "dia" ? "desc" : "asc" }));
    }
  };

  const t = actividad.totales;
  return (
    <div className="flex flex-col gap-3">
      <VistasActividad
        predefinidas={predefinidas}
        guardadas={vistas}
        activa={vistaActiva}
        onAplicar={aplicarVista}
        onEliminar={eliminar}
        onGuardar={(nombre) => setVistaActiva(guardar(nombre, filtros, columnas).id)}
      />
      <FiltrosActividadBar
        filtros={filtros}
        catalogos={catalogos}
        opcionesRegistro={opcionesRegistro}
        onCambiar={cambiar}
        onLimpiar={() => aplicarVista("todo")}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
          {t && (
            <>
              <span className="text-foreground">{`${entero(t.n)} movimientos`}</span>
              <span>{plural(t.porTipo.pago, "pago", "pagos")}</span>
              <span>{plural(t.porTipo.visita, "visita", "visitas")}</span>
              <span>{plural(t.porTipo.condonacion, "condonación", "condonaciones")}</span>
              <span>{`cobrado ${dinero(t.importe)}`}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Agrupar
            <select
              className="h-9 rounded-full bg-dsm-tarjeta pl-3 pr-7 text-[13px] ring-1 ring-border"
              value={agrupacion}
              onChange={(e) => agrupar(e.target.value as Agrupacion)}
            >
              {AGRUPACIONES.map(([v, texto]) => (
                <option key={v} value={v}>
                  {texto}
                </option>
              ))}
            </select>
          </label>
          <MenuColumnas columnas={columnas} onAlternar={alternar} />
        </div>
      </div>

      {actividad.error && actividad.items.length === 0 ? (
        <ErrorConReintento
          titulo="No se pudo cargar la actividad"
          mensaje={actividad.error.message}
          onReintentar={actividad.refresh}
        />
      ) : actividad.isLoading ? (
        <div className="h-48 animate-pulse rounded-[14px] bg-dsm-tarjeta" />
      ) : actividad.items.length === 0 ? (
        <div className="rounded-[14px] bg-dsm-tarjeta ring-1 ring-border">
          <EstadoVacio
            titulo="Ningún movimiento con estos filtros"
            detalle="Quita algún filtro o usa “Limpiar”."
          />
        </div>
      ) : (
        <TablaActividad
          items={actividad.items}
          columnas={columnas}
          filtros={filtros}
          agrupacion={agrupacion}
          onOrdenar={ordenar}
          onAbrir={onAbrirActividad}
          onAbrirVenta={onAbrirVenta}
          renderFotos={renderFotos}
        />
      )}
      {actividad.error && actividad.items.length > 0 && (
        <p role="alert" className="text-center text-xs text-dsm-rojo">
          {actividad.error.message}
        </p>
      )}
      {actividad.hayMas && (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={actividad.isLoadingMas}
            onClick={actividad.cargarMas}
            className="h-9 rounded-full bg-dsm-tarjeta px-4 text-[13px] ring-1 ring-border hover:bg-muted disabled:opacity-50"
          >
            Mostrar 100 más
          </button>
        </div>
      )}
    </div>
  );
}
