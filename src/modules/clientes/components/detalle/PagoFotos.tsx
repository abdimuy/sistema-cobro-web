import { useState } from "react";
import { createPortal } from "react-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthenticatedImage, VentaImagenLightbox, type FuenteImagen } from "@/modules/ventasLocales";
import { useClientesPort } from "../../presentation/context/ClientesContext";
import { useImagenesPago } from "../../presentation/hooks/useImagenesPago";

const TITULO = "mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground";

// Sección de fotos del pago (spec §3.3: reemplaza "Sin comprobante" cuando el
// pago tiene fila en MSP_PAGOS_RECIBIDOS).
export function PagoFotos({ pagoRecibidoId }: { pagoRecibidoId: string | null }) {
  const port = useClientesPort();
  const { imagenes, isLoading, error } = useImagenesPago(pagoRecibidoId);
  const [abierta, setAbierta] = useState<number | null>(null);

  if (pagoRecibidoId === null) {
    return (
      <section>
        <h4 className={TITULO}>Comprobante</h4>
        <p className="font-mono text-[11px] italic text-muted-foreground">Sin comprobante</p>
      </section>
    );
  }

  const fuentePara = (imagenId: string): FuenteImagen => ({
    cacheKey: `pago/${pagoRecibidoId}/${imagenId}`,
    descargar: () => port.descargarImagenPago(pagoRecibidoId, imagenId),
  });

  return (
    <section>
      <h4 className={TITULO}>{imagenes.length > 0 ? `Fotos · ${imagenes.length}` : "Fotos"}</h4>
      {isLoading && <Skeleton className="h-24 w-full" />}
      {error && <p className="text-[12px] text-muted-foreground">No se pudieron cargar las fotos</p>}
      {!isLoading && !error && imagenes.length === 0 && (
        <p className="font-mono text-[11px] italic text-muted-foreground">No se tomaron fotos</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {imagenes.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setAbierta(i)}
            className="aspect-square overflow-hidden rounded-md border border-border/60 bg-muted"
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
    </section>
  );
}
