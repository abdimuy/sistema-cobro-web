import { forwardRef, useState, type ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { ImagenListado, VentaLocal } from "@/services/api/getVentasLocales";
import AuthenticatedImage from "./detalle/AuthenticatedImage";
import VentaImagenLightbox from "./detalle/VentaImagenLightbox";
import {
  fuenteImagenArchivo,
  fuenteImagenVenta,
  type FuenteImagen,
} from "./detalle/fuenteImagen";
import { fechaHoraOficina } from "./archivo/formatoArchivo";

/** Con más de MAX_MINIATURAS fotos: MINIATURAS_CON_MAS miniaturas + casilla "+N". */
const MAX_MINIATURAS = 6;
const MINIATURAS_CON_MAS = 5;

const ANCHO_PILA = "w-[34px]";

/** Espacio del mismo ancho que la pila: los nombres quedan alineados. */
export function FotosEspacio() {
  return <span aria-hidden="true" data-testid="fotos-espacio" className={`inline-block h-[30px] flex-none ${ANCHO_PILA}`} />;
}

const Pila = forwardRef<
  HTMLButtonElement,
  { total: number; nombre: string } & ButtonHTMLAttributes<HTMLButtonElement>
>(function Pila({ total, nombre, onClick, ...resto }, ref) {
  const tarjeta =
    "absolute left-[3px] top-[4px] h-[20px] w-[24px] rounded-[4px] border border-border bg-muted shadow-sm transition-transform duration-[180ms] motion-reduce:transition-none";
  return (
    <button
      {...resto}
      ref={ref}
      type="button"
      aria-label={`${total} ${total === 1 ? "foto" : "fotos"} de ${nombre}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`group/pila relative inline-block h-[30px] ${ANCHO_PILA} flex-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      <span
        aria-hidden="true"
        className={`${tarjeta} rotate-[-8deg] group-hover/pila:-translate-x-[2px] group-hover/pila:rotate-[-14deg] group-focus-visible/pila:-translate-x-[2px] group-focus-visible/pila:rotate-[-14deg]`}
      />
      <span
        aria-hidden="true"
        className={`${tarjeta} translate-x-[3px] translate-y-[1px] bg-card group-hover/pila:translate-x-[5px] group-hover/pila:-translate-y-[1px] group-focus-visible/pila:translate-x-[5px] group-focus-visible/pila:-translate-y-[1px]`}
      />
      <span
        aria-hidden="true"
        data-testid="fotos-contador"
        className="absolute bottom-0 right-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border border-background bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground"
      >
        {total}
      </span>
    </button>
  );
});

function Tarjeta({
  imagenes,
  fuentePara,
  onAbrir,
}: {
  imagenes: ImagenListado[];
  fuentePara: (id: string) => FuenteImagen;
  onAbrir: (indice: number) => void;
}) {
  const [activo, setActivo] = useState(0);
  const total = imagenes.length;
  const img = imagenes[activo] ?? imagenes[0];
  const hayMas = total > MAX_MINIATURAS;
  const miniaturas = hayMas ? imagenes.slice(0, MINIATURAS_CON_MAS) : imagenes;
  if (!img) return null;
  const descripcion = img.descripcion?.trim() || `Foto ${activo + 1}`;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        aria-label={`Abrir foto: ${descripcion}`}
        onClick={() => onAbrir(activo)}
        className="relative block h-[168px] w-full overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AuthenticatedImage
          key={img.id}
          fuente={fuentePara(img.id)}
          alt={descripcion}
          textoError="Foto no disponible"
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-8 text-left text-white">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium">{descripcion}</span>
            <span className="text-[11px] opacity-85">
              {`Subida ${fechaHoraOficina(img.created_at)}`}
            </span>
          </span>
          <span className="flex-none text-[11px] tabular-nums">{`${activo + 1} / ${total}`}</span>
        </span>
      </button>
      <div className="flex gap-1.5">
        {miniaturas.map((m, i) => (
          <button
            key={m.id}
            type="button"
            aria-label={`Ver foto: ${m.descripcion?.trim() || `Foto ${i + 1}`}`}
            aria-current={i === activo ? "true" : undefined}
            onMouseEnter={() => setActivo(i)}
            onFocus={() => setActivo(i)}
            onClick={() => onAbrir(i)}
            className={`h-10 w-10 flex-none overflow-hidden rounded border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              i === activo ? "border-2 border-primary" : "border-border"
            }`}
          >
            <AuthenticatedImage fuente={fuentePara(m.id)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {hayMas && (
          <button
            type="button"
            aria-label={`Ver ${total - MINIATURAS_CON_MAS} fotos más`}
            onClick={() => onAbrir(MINIATURAS_CON_MAS)}
            className="flex h-10 w-10 flex-none items-center justify-center rounded border border-border bg-muted text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {`+${total - MINIATURAS_CON_MAS}`}
          </button>
        )}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Pasa por la tira para cambiar</span>
        <span>Clic para abrir</span>
      </div>
    </div>
  );
}

/**
 * Pila de fotos antes del nombre del cliente + tarjeta de vista previa al
 * pasar el ratón. Las imágenes sólo se piden con la tarjeta abierta (Radix
 * desmonta el contenido cerrado). App: abre el visor; Archivo: avisa al
 * listado para que abra el panel en esa foto.
 */
export function FotosVistaPrevia({
  venta,
  onAbrirArchivo,
}: {
  venta: VentaLocal;
  onAbrirArchivo?: (indice: number, retorno: HTMLElement | null) => void;
}) {
  const imagenes = venta.IMAGENES ?? [];
  const [visor, setVisor] = useState<number | null>(null);
  const [abierta, setAbierta] = useState(false);
  const esArchivo = venta.ORIGEN === "archivo";
  const ventaId = venta.LOCAL_SALE_ID;

  if (imagenes.length === 0) return <FotosEspacio />;

  const fuentePara = (id: string) =>
    esArchivo ? fuenteImagenArchivo(ventaId, id) : fuenteImagenVenta(ventaId, id);

  const abrir = (indice: number) => {
    setAbierta(false);
    if (esArchivo) onAbrirArchivo?.(indice, document.activeElement as HTMLElement | null);
    else setVisor(indice);
  };

  return (
    <>
      <HoverCard openDelay={200} closeDelay={100} open={abierta} onOpenChange={setAbierta}>
        <HoverCardTrigger asChild>
          <Pila total={imagenes.length} nombre={venta.NOMBRE_CLIENTE} onClick={() => abrir(0)} />
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent
            side="bottom"
            align="start"
            collisionPadding={8}
            avoidCollisions
            className="w-[320px] p-3"
          >
            <Tarjeta imagenes={imagenes} fuentePara={fuentePara} onAbrir={abrir} />
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCard>
      {visor !== null &&
        createPortal(
          <VentaImagenLightbox
            fuentePara={fuentePara}
            imagenes={imagenes}
            initialIndex={visor}
            onClose={() => setVisor(null)}
          />,
          document.body,
        )}
    </>
  );
}

export default FotosVistaPrevia;
