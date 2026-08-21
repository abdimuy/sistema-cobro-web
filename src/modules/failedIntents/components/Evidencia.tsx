import { useEffect, useState } from "react";
import type { BlobPart } from "../domain/entities";
import { useBlobParts } from "../presentation/hooks/useBlobParts";

// Evidencia muestra lo que fotografió el vendedor. **Se ve, no se abre.**
//
// La diferencia importa: quien revisa una venta atorada necesita saber en un
// vistazo si el vendedor capturó el domicilio, la INE y la firma. Un renglón
// que dice "3 archivos adjuntos" obliga a descargar el multipart completo
// para contestar esa pregunta, y nadie lo hace.
//
// No hace falta backend nuevo. `getBlobParts` y `downloadBlobPart` ya existen
// en el puerto y en el API (`GET /{id}/blob-parts` y `.../{index}/download`);
// lo único que faltaba era pedirlos aquí.
export function Evidencia({ intentId }: { intentId: string | null }) {
  const { bundle, isLoading, error, downloadPart } = useBlobParts(intentId);

  if (!intentId) return null;
  if (isLoading) {
    return <p className="text-[11.5px] text-zinc-500">Cargando evidencia…</p>;
  }
  if (error) {
    return (
      <p className="text-[11.5px] text-zinc-500" data-testid="evidencia-error">
        No se pudo leer la evidencia: {error.message}
      </p>
    );
  }

  const imagenes = (bundle?.parts ?? []).filter(esImagen);
  if (imagenes.length === 0) {
    return (
      <p className="text-[11.5px] text-zinc-500" data-testid="evidencia-vacia">
        Sin fotos capturadas
      </p>
    );
  }

  const bytes = imagenes.reduce((t, p) => t + p.sizeBytes, 0);

  return (
    <div data-testid="evidencia">
      <div className="grid grid-cols-3 gap-1.5">
        {imagenes.map((parte) => (
          <Miniatura key={parte.index} parte={parte} descargar={downloadPart} />
        ))}
      </div>
      <p className="text-[11.5px] text-zinc-500 mt-[7px]">
        {imagenes.length} {imagenes.length === 1 ? "foto" : "fotos"} · {megas(bytes)}
      </p>
    </div>
  );
}

// Miniatura descarga su parte una sola vez y la pinta. El objectURL se revoca
// al desmontar: sin eso, abrir treinta intentos en una sesión deja treinta
// blobs vivos en memoria.
function Miniatura({
  parte,
  descargar,
}: {
  parte: BlobPart;
  descargar: (index: number) => Promise<Blob>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vivo = true;
    let creado: string | null = null;

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
  }, [parte.index, descargar]);

  const etiqueta = parte.filename ?? parte.name ?? `Parte ${parte.index}`;

  return (
    <figure
      className="relative m-0 aspect-[3/4] overflow-hidden rounded-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800"
      data-testid={`evidencia-parte-${parte.index}`}
    >
      {url && !fallo ? (
        <img src={url} alt={etiqueta} className="w-full h-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-[10px] text-zinc-500 px-1 text-center">
          {fallo ? "No se pudo cargar" : "…"}
        </span>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[9.5px] px-1.5 py-[3px] truncate">
        {etiqueta}
      </figcaption>
    </figure>
  );
}

function esImagen(parte: BlobPart): boolean {
  return parte.kind.isFile() && parte.contentType.startsWith("image/");
}

function megas(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
