import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FuenteImagen } from "./fuenteImagen";

interface Props {
  fuente: FuenteImagen;
  alt?: string;
  className?: string;
  onLoad?: (el: HTMLImageElement) => void;
}

// Ref-counted blob cache. Multiple consumers (thumbnail + lightbox) of the
// same image share one fetch and one object URL. When the last consumer
// unmounts, the URL is revoked so we don't leak memory across long sessions.
// The key now comes from the caller's FuenteImagen (venta/…, pago/…, visita/…).
interface Entry {
  promise: Promise<string>;
  refs: number;
}
const cache = new Map<string, Entry>();

// Concurrency throttle so a 20-image grid doesn't open 20 parallel XHRs.
const MAX_INFLIGHT = 4;
let inFlight = 0;
const waiting: Array<() => void> = [];

const acquireSlot = (): Promise<void> =>
  new Promise((resolve) => {
    if (inFlight < MAX_INFLIGHT) {
      inFlight++;
      resolve();
    } else {
      waiting.push(() => {
        inFlight++;
        resolve();
      });
    }
  });

const releaseSlot = () => {
  inFlight--;
  const next = waiting.shift();
  if (next) next();
};

const fetchImage = async (descargar: () => Promise<Blob>): Promise<string> => {
  await acquireSlot();
  try {
    return URL.createObjectURL(await descargar());
  } finally {
    releaseSlot();
  }
};

const acquire = (key: string, descargar: () => Promise<Blob>): Promise<string> => {
  let entry = cache.get(key);
  if (!entry) {
    entry = { promise: fetchImage(descargar), refs: 0 };
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
    entry.promise
      .then((url) => URL.revokeObjectURL(url))
      .catch(() => {});
  }
};

export const AuthenticatedImage = ({ fuente, alt, className, onLoad }: Props) => {
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
      <div
        role="img"
        aria-label="No se pudo cargar la imagen"
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  if (!url) {
    return (
      <div aria-label="Cargando imagen" className={cn("flex items-center justify-center bg-muted", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
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
