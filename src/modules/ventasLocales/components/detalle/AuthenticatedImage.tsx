import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FuenteImagen } from "./fuenteImagen";

interface Props {
  fuente: FuenteImagen;
  alt?: string;
  className?: string;
  onLoad?: (el: HTMLImageElement) => void;
  /** Texto visible cuando la descarga falla; sin él solo se muestra el ícono. */
  textoError?: string;
}

// Ref-counted blob cache. Multiple consumers (thumbnail + lightbox) of the
// same image share one fetch and one object URL. When the last consumer
// unmounts, the URL is revoked so we don't leak memory across long sessions.
// The key now comes from the caller's FuenteImagen (venta/…, pago/…, visita/…).
interface Entry {
  promise: Promise<string>;
  refs: number;
  /** Saca la descarga de la cola si todavía no empezó; false si ya empezó. */
  cancelar: () => boolean;
}
const cache = new Map<string, Entry>();

// Concurrency throttle so a 20-image grid doesn't open 20 parallel XHRs.
const MAX_INFLIGHT = 4;
let inFlight = 0;
interface Espera {
  resolve: () => void;
  reject: (e: Error) => void;
}
const waiting: Espera[] = [];

const acquireSlot = (): { slot: Promise<void>; cancelar: () => boolean } => {
  if (inFlight < MAX_INFLIGHT) {
    inFlight++;
    return { slot: Promise.resolve(), cancelar: () => false };
  }
  let espera!: Espera;
  const slot = new Promise<void>((resolve, reject) => {
    espera = {
      resolve: () => {
        inFlight++;
        resolve();
      },
      reject,
    };
    waiting.push(espera);
  });
  return {
    slot,
    cancelar: () => {
      const i = waiting.indexOf(espera);
      if (i < 0) return false;
      waiting.splice(i, 1);
      espera.reject(new Error("descarga cancelada"));
      return true;
    },
  };
};

const releaseSlot = () => {
  inFlight--;
  const next = waiting.shift();
  if (next) next.resolve();
};

const fetchImage = (descargar: () => Promise<Blob>) => {
  const { slot, cancelar } = acquireSlot();
  const promise = slot.then(async () => {
    try {
      return URL.createObjectURL(await descargar());
    } finally {
      releaseSlot();
    }
  });
  return { promise, cancelar };
};

const acquire = (key: string, descargar: () => Promise<Blob>): Promise<string> => {
  let entry = cache.get(key);
  if (!entry) {
    entry = { ...fetchImage(descargar), refs: 0 };
    cache.set(key, entry);
  }
  entry.refs++;
  return entry.promise;
};

const release = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return;
  entry.refs--;
  if (entry.refs <= 0) {
    cache.delete(key);
    // Sin consumidores: lo que sigue en cola no se descarga. Lo ya iniciado termina.
    entry.cancelar();
    entry.promise
      .then((url) => URL.revokeObjectURL(url))
      .catch(() => {});
  }
};

export const AuthenticatedImage = ({ fuente, alt, className, onLoad, textoError }: Props) => {
  const key = fuente.cacheKey;
  // El descargador puede ser una función nueva en cada render; la clave manda.
  const fuenteRef = useRef(fuente);
  fuenteRef.current = fuente;
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setError(false);
    acquire(key, fuenteRef.current.descargar)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      release(key);
    };
  }, [key]);

  if (error) {
    return (
      <span
        role="img"
        aria-label="No se pudo cargar la imagen"
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <span className="flex flex-col items-center gap-1 text-center">
          <ImageOff className="h-5 w-5" />
          {textoError && <span className="text-xs">{textoError}</span>}
        </span>
      </span>
    );
  }

  if (!url) {
    return (
      <span aria-label="Cargando imagen" className={cn("flex items-center justify-center bg-muted", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? "imagen"}
      className={className}
      onLoad={(e) => onLoad?.(e.currentTarget)}
      draggable={false}
    />
  );
};

export default AuthenticatedImage;
