import { useCallback, useEffect, useState, type ReactNode } from "react";
import { registrar } from "@/lib/bitacora";
import { cargarGoogleMaps, LLAVE_GOOGLE_MAPS } from "./cargadorGoogleMaps";

type Estado = "cargando" | "listo" | "error";

interface Props {
  children: ReactNode;
  /** Alto del aviso de carga/error, para que no brinque el layout. */
  alto?: string;
}

/**
 * Pinta a sus hijos (un `GoogleMap`) sólo cuando el script de Maps ya está
 * cargado. Mientras tanto muestra "Cargando mapa…"; si falla, un aviso con
 * botón para reintentar. El resto de la pantalla no espera a Maps.
 */
export function MapaConCarga({ children, alto = "100%" }: Props) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado("cargando");
    cargarGoogleMaps(LLAVE_GOOGLE_MAPS).then(
      () => {
        if (vigente) setEstado("listo");
      },
      (e: unknown) => {
        registrar(
          "warn",
          `google maps no cargó: ${e instanceof Error ? e.message : String(e)}`,
        );
        if (vigente) setEstado("error");
      },
    );
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  if (estado === "listo") return <>{children}</>;

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-border/40 bg-muted/30"
      style={{ height: alto }}
    >
      {estado === "cargando" ? (
        <span className="text-xs text-muted-foreground">Cargando mapa…</span>
      ) : (
        <>
          <span className="text-xs text-muted-foreground">No se pudo cargar el mapa</span>
          <button
            type="button"
            onClick={reintentar}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            Reintentar
          </button>
        </>
      )}
    </div>
  );
}
