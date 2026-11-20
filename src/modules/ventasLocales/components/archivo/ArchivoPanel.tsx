import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import MapSimple from "@/components/MapSimple";
import { Skeleton } from "@/components/ui/skeleton";
import type { VentaArchivoDTO } from "@/services/api/getVentaArchivo";
import { useVentaArchivo } from "../../presentation/hooks/useVentaArchivo";
import { ArchivoBadge } from "../ArchivoBadge";
import { ArchivoGaleria } from "./ArchivoGaleria";
import { direccionCompleta, lineaSoloConsulta } from "./formatoArchivo";

const VACIO = "—";

// 0 o null = "sin ubicación": nunca se pinta (0,0) en el mapa.
function puntoValido(v: VentaArchivoDTO): { lat: number; lng: number } | null {
  const { latitud: lat, longitud: lng } = v;
  if (lat === null || lng === null) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

const texto = (s: string) => (s.trim() === "" ? VACIO : s);

function Fila({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="m-0 min-w-0 break-words">{children}</dd>
    </>
  );
}

function BotonCerrar({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Cerrar detalle"
      onClick={onClose}
      className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md border border-border bg-background"
    >
      <X aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
  );
}

export function ArchivoPanel({
  ventaId,
  fotoInicial,
  onClose,
}: {
  ventaId: string;
  /** Foto en la que abre la galería (vista previa de fotos de la lista). */
  fotoInicial?: { indice: number };
  onClose: () => void;
}) {
  const { venta, loading, error, reintentar } = useVentaArchivo(ventaId);
  const panelRef = useRef<HTMLElement>(null);

  // Al abrir (o cambiar de venta / terminar de cargar, que remonta el botón)
  // el foco va al botón de cerrar.
  const cargada = venta !== null && venta !== undefined;
  useEffect(() => {
    panelRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="Cerrar detalle"]')
      ?.focus();
  }, [ventaId, cargada]);

  return (
    <aside
      ref={panelRef}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      aria-label="Detalle de venta de Archivo"
      className="panel-aparece flex w-[min(420px,45%)] min-w-0 flex-none flex-col overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-background"
    >
      {venta ? (
        <>
          <div className="flex items-start justify-between gap-2.5 border-b border-border/60 px-4 py-3.5">
            <div className="flex min-w-0 flex-col gap-1">
              <ArchivoBadge variant="insignia" className="self-start" />
              <h2 className="m-0 text-[17px] font-semibold">
                {venta.nombre_cliente}
              </h2>
              <p className="m-0 text-xs text-muted-foreground">
                {lineaSoloConsulta(venta)}
              </p>
            </div>
            <BotonCerrar onClose={onClose} />
          </div>
          <ArchivoGaleria ventaId={venta.id} imagenes={venta.imagenes} fotoInicial={fotoInicial} />
          <dl className="m-0 grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 pb-4 pt-3 text-[13px]">
            <Fila etiqueta="Dirección">{direccionCompleta(venta)}</Fila>
            <Fila etiqueta="Teléfono">
              <span className="tabular-nums">{texto(venta.telefono)}</span>
            </Fila>
            <Fila etiqueta="Artículos">
              {venta.articulos.length === 0 ? (
                VACIO
              ) : (
                <ul className="m-0 list-none p-0">
                  {venta.articulos.map((a, i) => (
                    <li
                      key={`${i}-${a.articulo_id}-${a.nombre}`}
                    >{`${a.cantidad} × ${a.nombre}`}</li>
                  ))}
                </ul>
              )}
            </Fila>
            <Fila etiqueta="Plan">{texto(venta.plan_texto)}</Fila>
            <Fila etiqueta="Vendedores">
              {venta.vendedores.length === 0
                ? VACIO
                : venta.vendedores.map((v) => v.nombre).join(", ")}
            </Fila>
            <Fila etiqueta="Capturada por">{texto(venta.capturada_por)}</Fila>
            <Fila etiqueta="Nota">{texto(venta.nota)}</Fila>
            <Fila etiqueta="Aval">{texto(venta.aval)}</Fila>
          </dl>
          <Ubicacion venta={venta} />
        </>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-3.5">
          <div className="flex justify-end">
            <BotonCerrar onClose={onClose} />
          </div>
          {loading ? (
            <div
              data-testid="archivo-panel-skeleton"
              className="flex flex-col gap-3"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div
              role="alert"
              className="flex flex-col items-start gap-2 text-sm"
            >
              <span>{error ?? "No se pudo cargar la venta"}</span>
              <button
                type="button"
                onClick={reintentar}
                className="rounded-md border border-border px-3 py-1.5 text-sm"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function Ubicacion({ venta }: { venta: VentaArchivoDTO }) {
  const punto = puntoValido(venta);
  if (!punto) {
    return (
      <p className="m-0 border-t border-border/60 px-4 py-3 text-[13px] text-muted-foreground">
        Sin ubicación
      </p>
    );
  }
  return (
    <div className="h-56 border-t border-border/60">
      <MapSimple point={punto} height="224px" zoom={16} />
    </div>
  );
}

export default ArchivoPanel;
