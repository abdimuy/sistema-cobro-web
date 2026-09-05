import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { BlobPart } from "../domain/entities";

/**
 * Visor a pantalla completa de las fotos que tomó el vendedor.
 *
 * Las miniaturas de la barra lateral miden ~90 px de alto: alcanzan para saber
 * que hay fotos, no para LEERLAS. Y lo que llevan es justo lo que hay que leer
 * —un INE, un recibo de luz, la firma del contrato—, así que la pantalla
 * mostraba evidencia ilegible.
 *
 * Reusa la misma descarga que la miniatura (`descargar(index)`), que ya viene
 * memoizada por intento, en vez de abrir una petición propia: el blob de la
 * foto ya está en memoria cuando alguien hace clic.
 */
export function VisorDeImagenes({
  imagenes,
  indiceInicial,
  descargar,
  onClose,
}: {
  imagenes: readonly BlobPart[];
  indiceInicial: number;
  descargar: (index: number) => Promise<Blob>;
  onClose: () => void;
}) {
  const [posicion, setPosicion] = useState(indiceInicial);
  const [url, setUrl] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);

  const total = imagenes.length;
  const parte = imagenes[posicion];

  const anterior = useCallback(
    () => setPosicion((p) => (p - 1 + total) % total),
    [total],
  );
  const siguiente = useCallback(() => setPosicion((p) => (p + 1) % total), [total]);

  // El teclado es lo que vuelve usable revisar cinco fotos seguidas: con el
  // ratón hay que apuntar a una flecha cada vez.
  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") siguiente();
    }
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onClose, anterior, siguiente]);

  // El objectURL se revoca al cambiar de foto y al cerrar. Sin eso, pasar por
  // veinte fotos deja veinte blobs vivos.
  useEffect(() => {
    if (!parte) return undefined;
    let vivo = true;
    let creado: string | null = null;
    setUrl(null);
    setFallo(false);
    descargar(parte.index)
      .then((blob) => {
        if (!vivo) return;
        creado = URL.createObjectURL(blob);
        setUrl(creado);
      })
      .catch(() => {
        if (vivo) setFallo(true);
      });
    return () => {
      vivo = false;
      if (creado) URL.revokeObjectURL(creado);
    };
  }, [parte, descargar]);

  if (!parte) return null;
  const etiqueta = parte.filename ?? parte.name ?? `Foto ${posicion + 1}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotos"
      data-testid="visor-imagenes"
    >
      <div className="flex items-center justify-between px-4 py-2 text-white/80 text-[12px]">
        <span className="truncate max-w-[60%]" data-testid="visor-etiqueta">
          {etiqueta}
        </span>
        <div className="flex items-center gap-3">
          <span data-testid="visor-contador">
            {posicion + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            data-testid="visor-cerrar"
            className="p-1 rounded hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-2 pb-4">
        {total > 1 && (
          <button
            type="button"
            onClick={anterior}
            aria-label="Foto anterior"
            data-testid="visor-anterior"
            className="p-2 text-white/70 hover:text-white shrink-0"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        {url && !fallo ? (
          <img
            src={url}
            alt={etiqueta}
            className="max-h-full max-w-full object-contain"
            data-testid="visor-imagen"
          />
        ) : (
          <span className="text-white/60 text-[12px]">
            {fallo ? "No se pudo cargar la foto" : "Cargando…"}
          </span>
        )}
        {total > 1 && (
          <button
            type="button"
            onClick={siguiente}
            aria-label="Foto siguiente"
            data-testid="visor-siguiente"
            className="p-2 text-white/70 hover:text-white shrink-0"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>
    </div>
  );
}
