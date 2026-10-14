import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Camera, CloudOff, MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Actividad, FiltrosActividad, OrdenActividad } from "../../domain/entities";
import type { ClaveColumna } from "../../presentation/actividadPreferencias";
import { diaDeNegocioDe, fechaCorta, horaCorta } from "../lib/format";
import { FORMA_COBRO_ETIQUETA } from "../lib/tipoActividadMeta";
import { InfoRapida } from "../comunes/InfoRapida";
import { IconoTipoActividad } from "../comunes/IconoTipoActividad";
import { MontoActividad } from "../comunes/MontoActividad";
import { TarjetaActividad } from "../comunes/TarjetaActividad";
import type { AbrirVenta } from "../jornada/describirActividades";
import { FolioVenta } from "../jornada/FolioVenta";
import { COLUMNAS } from "./columnas";
import { agruparConsecutivos, type Agrupacion } from "./agrupar";

function cuando(iso: string): string {
  return `${fechaCorta(diaDeNegocioDe(iso))} · ${horaCorta(iso)}`;
}

function Celda({
  clave,
  a,
  onAbrirVenta,
  renderFotos,
}: {
  clave: ClaveColumna;
  a: Actividad;
  onAbrirVenta?: AbrirVenta;
  renderFotos?: (a: Actividad) => ReactNode;
}) {
  switch (clave) {
    case "tipo":
      return (
        <InfoRapida contenido={<TarjetaActividad actividad={a} />}>
          <span>
            <IconoTipoActividad tipo={a.tipo} />
          </span>
        </InfoRapida>
      );
    case "hora":
      return <span className="whitespace-nowrap font-mono text-[12px]">{cuando(a.hora)}</span>;
    case "cliente":
      return (
        <InfoRapida contenido={<TarjetaActividad actividad={a} />}>
          <span className="cursor-help">{a.clienteNombre}</span>
        </InfoRapida>
      );
    case "venta":
      return (
        <FolioVenta actividad={a} onAbrirVenta={onAbrirVenta} className="font-mono text-[12px]" />
      );
    case "monto":
      return <MontoActividad actividad={a} />;
    case "forma":
      return (
        <span>{a.pago && a.tipo === "pago" ? FORMA_COBRO_ETIQUETA[a.pago.formaCobro] : "—"}</span>
      );
    case "registro":
      return (
        <span className={a.registradoPor.origen === "oficina" ? "text-dsm-violeta" : undefined}>
          {a.registradoPor.nombre}
        </span>
      );
    case "llegada":
      if (!a.recibidoAt) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px]">
          {cuando(a.recibidoAt)}
          {a.capturaTardia && (
            <span title="Llegó tarde al servidor" className="text-dsm-ambar">
              <CloudOff aria-hidden className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
      );
    case "fotos":
      if (renderFotos) return <>{renderFotos(a)}</>;
      return a.numFotos > 0 ? (
        <span className="inline-flex items-center gap-1">
          <Camera aria-hidden className="h-3.5 w-3.5" />
          {a.numFotos}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    case "gps":
      return a.conGps ? (
        <MapPin aria-label="Con GPS" className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <span title="Sin GPS" className="text-dsm-ambar">
          <MapPinOff aria-hidden className="h-3.5 w-3.5" />
        </span>
      );
  }
}

export function TablaActividad({
  items,
  columnas,
  filtros,
  agrupacion,
  onOrdenar,
  onAbrir,
  onAbrirVenta,
  renderFotos,
}: {
  items: readonly Actividad[];
  columnas: readonly ClaveColumna[];
  filtros: FiltrosActividad;
  agrupacion: Agrupacion;
  onOrdenar: (orden: OrdenActividad) => void;
  onAbrir: (a: Actividad) => void;
  onAbrirVenta?: AbrirVenta;
  renderFotos?: (a: Actividad) => ReactNode;
}) {
  const visibles = COLUMNAS.filter((c) => columnas.includes(c.clave));
  const renglon = (a: Actividad) => (
    <tr
      key={a.id}
      onClick={() => onAbrir(a)}
      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/50"
    >
      {visibles.map((c) => (
        <td
          key={c.clave}
          className={cn("px-3 py-2.5 text-[13px]", c.derecha && "text-right")}
          onClick={c.clave === "fotos" ? (e) => e.stopPropagation() : undefined}
        >
          <Celda clave={c.clave} a={a} onAbrirVenta={onAbrirVenta} renderFotos={renderFotos} />
        </td>
      ))}
    </tr>
  );
  const Flecha = filtros.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <div className="overflow-x-auto rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {visibles.map((c) => {
              const orden = c.orden;
              const activa = orden !== null && filtros.orden === orden;
              return (
                <th
                  key={c.clave}
                  aria-sort={
                    activa ? (filtros.dir === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn("px-3 py-2 text-left font-normal", c.derecha && "text-right")}
                >
                  {orden ? (
                    <button
                      type="button"
                      onClick={() => onOrdenar(orden)}
                      className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
                    >
                      {c.titulo}
                      {activa && <Flecha aria-hidden className="h-3 w-3" />}
                    </button>
                  ) : (
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      {c.titulo}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {agrupacion === ""
            ? items.map(renglon)
            : agruparConsecutivos(items, agrupacion).map((g) => [
                <tr key={`g-${g.clave}-${g.items[0].id}`} data-testid="grupo" className="bg-muted/40">
                  <td colSpan={visibles.length} className="px-3 py-1.5 text-[12.5px] font-medium">
                    {g.clave}
                  </td>
                </tr>,
                ...g.items.map(renglon),
              ])}
        </tbody>
      </table>
    </div>
  );
}
