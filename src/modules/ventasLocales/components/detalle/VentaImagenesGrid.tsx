import { useState } from "react";
import { ImageIcon } from "lucide-react";
import AuthenticatedImage from "./AuthenticatedImage";
import VentaImagenLightbox from "./VentaImagenLightbox";
import { ImagenV2 } from "@/services/api/ventaV2Types";

interface Props {
  ventaId: string;
  imagenes: ImagenV2[];
}

export const VentaImagenesGrid = ({ ventaId, imagenes }: Props) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (imagenes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-muted-foreground">
        <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
        <p className="text-sm">No hay imágenes adjuntas</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {imagenes.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted transition hover:border-border focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <AuthenticatedImage
              ventaId={ventaId}
              imagenId={img.id}
              alt={img.descripcion ?? "imagen de la venta"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            {img.descripcion && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="line-clamp-1 text-[11px] text-white">{img.descripcion}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <VentaImagenLightbox
          ventaId={ventaId}
          imagenes={imagenes}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
};

export default VentaImagenesGrid;
