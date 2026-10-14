import { useState } from "react";
import { createPortal } from "react-dom";
import { Skeleton } from "@/components/ui/skeleton";
// Imports directos (no el index de detalle) para no arrastrar todo el modal de ventas.
import { AuthenticatedImage, VentaImagenLightbox, type FuenteImagen } from "@/modules/ventasLocales";
import type { RefImagenes } from "../../domain/entities";
import { descargarImagen } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../../presentation/context/useDesempenoPort";
import { claveDeRef, useImagenes } from "../../presentation/hooks/useImagenes";

// Galería + visor de Ventas Locales (spec §3.3) con el descargador de Desempeño.
export function GaleriaFotos({
  refImagenes,
  mensajeSinFotos,
  limite,
}: {
  refImagenes: RefImagenes | null;
  mensajeSinFotos: string;
  limite?: number;
}) {
  const port = useDesempenoPort();
  const { imagenes, isLoading, error } = useImagenes(refImagenes);
  const [abierta, setAbierta] = useState<number | null>(null);

  if (refImagenes === null) {
    return <p className="font-mono text-[11px] italic text-muted-foreground">{mensajeSinFotos}</p>;
  }
  if (error) return <p className="text-[12px] text-muted-foreground">No se pudieron cargar las fotos</p>;
  if (isLoading || imagenes === null) return <Skeleton className="h-20 w-full" />;
  if (imagenes.length === 0) {
    return <p className="font-mono text-[11px] italic text-muted-foreground">{mensajeSinFotos}</p>;
  }

  const ref = refImagenes;
  const fuentePara = (imagenId: string): FuenteImagen => ({
    cacheKey: `${claveDeRef(ref)}/${imagenId}`,
    descargar: () => descargarImagen(port, ref, imagenId),
  });
  const visibles = limite ? imagenes.slice(0, limite) : imagenes;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {visibles.map((img, i) => (
          <button
            key={img.id}
            type="button"
            aria-label={`Ver ${img.descripcion ?? `foto ${i + 1}`}`}
            onClick={() => setAbierta(i)}
            className="aspect-[4/3] overflow-hidden rounded-md bg-muted ring-1 ring-border"
          >
            <AuthenticatedImage
              fuente={fuentePara(img.id)}
              alt={img.descripcion ?? `Foto ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      {/* Portal a <body>: el DialogContent tiene transform y atraparía el visor fijo. */}
      {abierta !== null &&
        createPortal(
          <VentaImagenLightbox
            imagenes={imagenes.map((img) => ({ id: img.id, descripcion: img.descripcion, created_at: img.createdAt }))}
            fuentePara={fuentePara}
            initialIndex={abierta}
            onClose={() => setAbierta(null)}
          />,
          document.body,
        )}
    </>
  );
}
