import { useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { VentaArchivoDTO } from "@/services/api/getVentaArchivo";
import AuthenticatedImage from "../detalle/AuthenticatedImage";
import { fuenteImagenArchivo } from "../detalle/fuenteImagen";
import { fechaHoraOficina } from "./formatoArchivo";

const botonFlecha =
  "absolute top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 text-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-900/90 dark:text-neutral-100";

export function ArchivoGaleria({
  ventaId,
  imagenes,
}: {
  ventaId: string;
  imagenes: VentaArchivoDTO["imagenes"];
}) {
  const [pedido, setPedido] = useState(0);
  const total = imagenes.length;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 bg-stone-100 text-sm text-stone-600 dark:bg-stone-900 dark:text-stone-300">
        <ImageOff aria-hidden="true" className="h-4 w-4" />
        Sin fotos
      </div>
    );
  }

  // Si las imágenes cambian y el índice queda fuera, se vuelve a la primera.
  const actual = pedido < total ? pedido : 0;
  const img = imagenes[actual];
  if (!img) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") setPedido(Math.min(actual + 1, total - 1));
    else if (e.key === "ArrowLeft") setPedido(Math.max(actual - 1, 0));
  };

  return (
    <div role="group" aria-label="Fotos de la venta" onKeyDown={onKeyDown}>
      <div className="relative bg-stone-100 dark:bg-stone-900">
        <div className="flex h-72 items-center justify-center">
          <AuthenticatedImage
            key={`${ventaId}/${img.id}`}
            fuente={fuenteImagenArchivo(ventaId, img.id)}
            alt={`Foto ${actual + 1} de ${total}`}
            textoError="Foto no disponible"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <button
          type="button"
          aria-label="Foto anterior"
          disabled={actual === 0}
          onClick={() => setPedido(actual - 1)}
          className={`${botonFlecha} left-2.5`}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Foto siguiente"
          disabled={actual === total - 1}
          onClick={() => setPedido(actual + 1)}
          className={`${botonFlecha} right-2.5`}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="text-[13px]">
          <b className="font-medium">{`Foto ${actual + 1} de ${total}`}</b>{" "}
          <span className="text-muted-foreground">
            {`· subida ${fechaHoraOficina(img.fecha_subida)}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {imagenes.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual ? "true" : undefined}
              onClick={() => setPedido(i)}
              className={`h-10 w-10 overflow-hidden rounded border bg-stone-100 dark:bg-stone-900 ${
                i === actual ? "border-2 border-blue-600" : "border-border"
              }`}
            >
              <AuthenticatedImage
                fuente={fuenteImagenArchivo(ventaId, m.id)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ArchivoGaleria;
