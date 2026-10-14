import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { Camera, CloudOff, MapPinOff, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Actividad, Pausa } from "../../domain/entities";
import { duracion, horaCorta } from "../lib/format";
import { InfoRapida } from "../comunes/InfoRapida";
import { IconoTipoActividad } from "../comunes/IconoTipoActividad";
import { MontoActividad } from "../comunes/MontoActividad";
import { TarjetaActividad } from "../comunes/TarjetaActividad";
import type { AbrirVenta } from "./describirActividades";
import { FolioVenta } from "./FolioVenta";

function RenglonPausa({ pausa }: { pausa: Pausa }) {
  return (
    <li className="flex items-center gap-2 bg-dsm-ambar-fondo px-[18px] py-2 text-[12.5px] text-dsm-ambar">
      <Pause aria-hidden className="h-3.5 w-3.5" />
      {`Pausa · ${duracion(pausa.minutos)} (${horaCorta(pausa.desde)}–${pausa.enCurso ? "ahora" : horaCorta(pausa.hasta)})`}
      {pausa.enCurso && " · sigue sin actividad"}
    </li>
  );
}

function FotosPorDefecto({ actividad }: { actividad: Actividad }) {
  if (actividad.numFotos === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Camera aria-hidden className="h-3.5 w-3.5" />
      {actividad.numFotos}
    </span>
  );
}

// Lista cronológica con las pausas intercaladas: cada pausa va después de la
// actividad `anterior_id` que la abrió (contrato §1); una pausa sin anterior
// (p. ej. antes del primer movimiento) va arriba.
export function ListaJornada({
  actividades,
  pausas,
  resaltada,
  onAbrir,
  onAbrirVenta,
  renderFotos,
}: {
  actividades: readonly Actividad[];
  pausas: readonly Pausa[];
  resaltada: string | null;
  onAbrir: (a: Actividad) => void;
  onAbrirVenta?: AbrirVenta;
  renderFotos?: (a: Actividad) => ReactNode;
}) {
  const refResaltada = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    refResaltada.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [resaltada]);

  return (
    <ol aria-label="Movimientos en orden" className="divide-y divide-border">
      {pausas
        .filter((p) => p.anteriorId === null)
        .map((p) => (
          <RenglonPausa key={`${p.desde}-inicio`} pausa={p} />
        ))}
      {actividades.map((a, i) => (
        <FragmentoActividad
          key={a.id}
          actividad={a}
          numero={i + 1}
          pausasDespues={pausas.filter((p) => p.anteriorId === a.id)}
          resaltada={resaltada === a.id}
          refResaltada={resaltada === a.id ? refResaltada : undefined}
          onAbrir={onAbrir}
          onAbrirVenta={onAbrirVenta}
          fotos={renderFotos ? renderFotos(a) : <FotosPorDefecto actividad={a} />}
        />
      ))}
    </ol>
  );
}

function FragmentoActividad({
  actividad: a,
  numero,
  pausasDespues,
  resaltada,
  refResaltada,
  onAbrir,
  onAbrirVenta,
  fotos,
}: {
  actividad: Actividad;
  numero: number;
  pausasDespues: readonly Pausa[];
  resaltada: boolean;
  refResaltada?: MutableRefObject<HTMLLIElement | null>;
  onAbrir: (a: Actividad) => void;
  onAbrirVenta?: AbrirVenta;
  fotos: ReactNode;
}) {
  return (
    <>
      <li
        ref={refResaltada}
        data-resaltada={resaltada ? "true" : undefined}
        tabIndex={0}
        onClick={() => onAbrir(a)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAbrir(a);
          }
        }}
        className={cn(
          "grid cursor-pointer grid-cols-[22px_44px_28px_1fr_auto_auto] items-center gap-3 px-[18px] py-[11px] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          resaltada && "bg-dsm-marca-fondo",
        )}
      >
        <span className="font-mono text-[11px] text-muted-foreground">{numero}</span>
        <time className="font-mono text-[12px]">{horaCorta(a.hora)}</time>
        <InfoRapida contenido={<TarjetaActividad actividad={a} />}>
          <span>
            <IconoTipoActividad tipo={a.tipo} />
          </span>
        </InfoRapida>
        <div className="min-w-0">
          <div className="truncate text-[14px]">{a.clienteNombre}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">
            <FolioVenta actividad={a} onAbrirVenta={onAbrirVenta} vacio="Sin venta" />
            {a.registradoPor.origen === "oficina" && " · registró oficina"}
          </div>
        </div>
        <div className="text-right">
          <MontoActividad actividad={a} />
        </div>
        <div className="flex items-center gap-2 text-[12px]" onClick={(e) => e.stopPropagation()}>
          {fotos}
          {a.capturaTardia && (
            <span title="Llegó tarde al servidor" className="text-dsm-gris">
              <CloudOff aria-hidden className="h-3.5 w-3.5" />
            </span>
          )}
          {!a.conGps && (
            <span title="Sin GPS" className="text-dsm-ambar">
              <MapPinOff aria-hidden className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </li>
      {pausasDespues.map((p) => (
        <RenglonPausa key={`${p.desde}-${p.hasta}`} pausa={p} />
      ))}
    </>
  );
}
