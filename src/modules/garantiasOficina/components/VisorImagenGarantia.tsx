import { useEffect, useMemo, useState } from "react";
import { crearGarantiasPort } from "../presentation/composition/crearGarantiasPort";

interface Props {
  garantiaId: string;
  eventoId: string;
  imagenId: string;
}

export function VisorImagenGarantia({
  garantiaId,
  eventoId,
  imagenId,
}: Props) {
  const port = useMemo(() => crearGarantiasPort(), []);
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) {
      setUrl(null);
      setCargando(false);
      return;
    }

    const controller = new AbortController();
    let urlCreada: string | null = null;

    setUrl(null);
    setCargando(true);
    setError(null);

    void port.descargarImagen(
      garantiaId,
      eventoId,
      imagenId,
      controller.signal,
    ).then((blob) => {
      if (controller.signal.aborted) return;

      if (!blob.type.startsWith("image/")) {
        throw new Error("El archivo recibido no es una imagen.");
      }

      urlCreada = URL.createObjectURL(blob);
      setUrl(urlCreada);
    }).catch((e: unknown) => {
      if (controller.signal.aborted) return;

      setError(
        e instanceof Error
          ? e.message
          : "No se pudo descargar la imagen.",
      );
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });

    return () => {
      controller.abort();
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [abierto, garantiaId, eventoId, imagenId, port]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="rounded border px-3 py-2 text-sm"
        onClick={() => setAbierto((anterior) => !anterior)}
      >
        {abierto ? "Cerrar imagen" : "Ver imagen"}
      </button>

      {abierto && (
        <div className="space-y-2">
          {cargando && <p role="status">Descargando imagen...</p>}
          {error && <p role="alert">{error}</p>}
          {url && (
            <img
              src={url}
              alt="Evidencia fotográfica de garantía"
              className="max-h-96 max-w-full rounded border object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}
