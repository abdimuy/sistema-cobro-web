import { useEffect, useState } from "react";
import type { BlobPart, BlobPartsBundle } from "../domain/entities";
import type { DomainError } from "../domain/errors";
import { VisorDeImagenes } from "./VisorDeImagenes";
import { LINEA, SUPERFICIE_2, TEXTO_2 } from "./paleta";

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
//
// **Se piden SÓLO con el panel abierto, y sólo para el renglón abierto.** Que
// exista `blob-parts` no autoriza una petición por renglón del listado: ahí
// serían veinte peticiones por página sobre el disco del servidor, y es
// exactamente el N+1 que el resumen en la fila existe para evitar. Hay una
// prueba que lo vigila: exige que abrir un renglón produzca EXACTAMENTE una
// llamada a `blob-parts`.
//
// Por eso este componente ya no tiene el hook: lo tiene la pantalla, que
// reparte el mismo resultado entre las fotos y el visor del cuerpo. Con un
// hook aquí y otro allá serían dos peticiones por renglón abierto — el mismo
// error, un nivel más abajo.
export function Evidencia({
  intentId,
  bundle,
  isLoading,
  error,
  downloadPart,
}: {
  intentId: string | null;
  bundle: BlobPartsBundle | null;
  isLoading: boolean;
  error: DomainError | null;
  downloadPart: (index: number) => Promise<Blob>;
}) {
  if (!intentId) return null;
  if (isLoading) {
    return <p className={`text-[11.5px] ${TEXTO_2}`}>Cargando evidencia…</p>;
  }
  if (error) {
    return (
      <p className={`text-[11.5px] ${TEXTO_2}`} data-testid="evidencia-error">
        No se pudo leer la evidencia: {error.message}
      </p>
    );
  }

  const imagenes = (bundle?.parts ?? []).filter(esImagen);
  if (imagenes.length === 0) {
    return (
      <p className={`text-[11.5px] ${TEXTO_2}`} data-testid="evidencia-vacia">
        Sin fotos capturadas
      </p>
    );
  }

  const bytes = imagenes.reduce((t, p) => t + p.sizeBytes, 0);

  return (
    <GaleriaDeEvidencia imagenes={imagenes} bytes={bytes} descargar={downloadPart} />
  );
}

// GaleriaDeEvidencia junta las miniaturas con el visor. El estado del visor
// vive aquí y no en Evidencia porque Evidencia tiene returns tempranos —de
// carga, de error, de vacío— y un hook por encima de ellos se saltaría las
// reglas de hooks en cuanto alguien mueva una guarda.
function GaleriaDeEvidencia({
  imagenes,
  bytes,
  descargar,
}: {
  imagenes: readonly BlobPart[];
  bytes: number;
  descargar: (index: number) => Promise<Blob>;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <div data-testid="evidencia">
      <div className="grid grid-cols-3 gap-1.5">
        {imagenes.map((parte, i) => (
          <Miniatura
            key={parte.index}
            parte={parte}
            descargar={descargar}
            onAbrir={() => setAbierta(i)}
          />
        ))}
      </div>
      <p className={`text-[11.5px] ${TEXTO_2} mt-[7px]`}>
        {imagenes.length} {imagenes.length === 1 ? "foto" : "fotos"} · {megas(bytes)}
        <span className="ml-1 opacity-70">· clic para ampliar</span>
      </p>
      {abierta !== null && (
        <VisorDeImagenes
          imagenes={imagenes}
          indiceInicial={abierta}
          descargar={descargar}
          onClose={() => setAbierta(null)}
        />
      )}
    </div>
  );
}

// Miniatura descarga su parte una sola vez y la pinta. El objectURL se revoca
// al desmontar: sin eso, abrir treinta intentos en una sesión deja treinta
// blobs vivos en memoria.
function Miniatura({
  parte,
  descargar,
  onAbrir,
}: {
  parte: BlobPart;
  descargar: (index: number) => Promise<Blob>;
  onAbrir: () => void;
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
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Ampliar ${etiqueta}`}
      className={`relative m-0 block w-full aspect-[3/4] overflow-hidden rounded-sm border ${LINEA} ${SUPERFICIE_2} cursor-zoom-in hover:opacity-90`}
      data-testid={`evidencia-parte-${parte.index}`}
    >
      {url && !fallo ? (
        <img src={url} alt={etiqueta} className="w-full h-full object-cover" />
      ) : (
        <span className={`flex h-full items-center justify-center text-[10px] ${TEXTO_2} px-1 text-center`}>
          {fallo ? "No se pudo cargar" : "…"}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[9.5px] px-1.5 py-[3px] truncate block">
        {etiqueta}
      </span>
    </button>
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
