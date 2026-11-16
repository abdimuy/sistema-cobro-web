import { useEffect, useState } from "react";
import { apiClient } from "../../infrastructure/http/apiClient";

interface UsuarioActualDTO {
  readonly permisos: string[];
}

export interface EstadoPermisosGarantias {
  readonly permisos: readonly string[];
  readonly cargando: boolean;
  readonly error: string | null;
}

export function usePermisosGarantias(): EstadoPermisosGarantias {
  const [permisos, setPermisos] = useState<readonly string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void apiClient.get<UsuarioActualDTO>("/me", {
      signal: controller.signal,
    }).then(({ data }) => {
      if (controller.signal.aborted) return;

      if (!Array.isArray(data.permisos) ||
          !data.permisos.every((p) => typeof p === "string")) {
        throw new Error("La respuesta de permisos no es válida");
      }

      setPermisos(data.permisos);
    }).catch((e: unknown) => {
      if (controller.signal.aborted) return;

      setPermisos([]);
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron consultar los permisos",
      );
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });

    return () => controller.abort();
  }, []);

  return { permisos, cargando, error };
}
