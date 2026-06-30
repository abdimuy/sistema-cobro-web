import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useClientesPort } from "../context/ClientesContext";
import { showNativeNotification } from "@/services/notifications/nativeNotification";
import { guardarReporte, imprimirReporte } from "./reporteActions";

// useDescargarReporte drives the preview-first report flow. generar() fetches
// the PDF Blob and exposes it as an object URL the modal embeds in an iframe; it
// no longer auto-downloads. From the preview the user can imprimir() (print via
// the embedded viewer) or guardarComo() (native Save-as + notification). The
// object URL is revoked on reset() and on unmount so long sessions don't leak.
export function useDescargarReporte(clienteId: number, nombreCliente: string) {
  const port = useClientesPort();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  // Keep the live URL in a ref so the unmount cleanup always revokes the latest
  // one without re-subscribing the effect on every regenerate.
  const urlRef = useRef<string | null>(null);
  const revoke = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const generar = useCallback(
    async (ventaIds?: number[]) => {
      setIsLoading(true);
      setError(false);
      try {
        const fetched = await port.descargarReporte(clienteId, ventaIds);
        revoke();
        const url = URL.createObjectURL(fetched);
        urlRef.current = url;
        setBlob(fetched);
        setObjectUrl(url);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [port, clienteId, revoke],
  );

  const reset = useCallback(() => {
    revoke();
    setBlob(null);
    setObjectUrl(null);
    setError(false);
  }, [revoke]);

  const imprimir = useCallback((iframeEl: HTMLIFrameElement | null) => {
    imprimirReporte(iframeEl);
  }, []);

  const guardarComo = useCallback(async () => {
    if (!blob) return;
    setIsSaving(true);
    try {
      const path = await guardarReporte(
        blob,
        nombreCliente,
        dayjs().format("YYYY-MM-DD"),
      );
      if (!path) return; // user cancelled the dialog
      await showNativeNotification("Reporte guardado", path);
      toast.success("Reporte guardado");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setIsSaving(false);
    }
  }, [blob, nombreCliente]);

  useEffect(() => () => revoke(), [revoke]);

  return {
    blob,
    objectUrl,
    isLoading,
    isSaving,
    error,
    generar,
    reset,
    imprimir,
    guardarComo,
  };
}
