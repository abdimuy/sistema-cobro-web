export interface IdentidadComando {
  readonly claveIdempotencia: string;
  readonly deviceCreatedAt: string;
}

export function nuevaIdentidadComando(): IdentidadComando {
  return {
    claveIdempotencia: crypto.randomUUID(),
    deviceCreatedAt: new Date().toISOString(),
  };
}

export interface ComandoBase {
  readonly device_created_at: string;
  readonly gps_lat?: number;
  readonly gps_lon?: number;
}

export type TipoComandoArticulo =
  | "diagnostico"
  | "dictamen"
  | "cambio-fisico"
  | "desenlace";

export interface DatosComandoArticulo {
  readonly ruta?: "proveedor" | "taller";
  readonly dictamen?: "aceptada" | "rechazada" | "sin_falla";
  readonly rol_decisor?: "carpinteria" | "oficina" | "tecnica";
  readonly desenlace?:
    | "reparado"
    | "reemplazado"
    | "devuelto"
    | "segunda_mano"
    | "desarmado"
    | "merma";
}

export type SolicitudComandoArticulo =
  | {
      readonly tipo: "diagnostico";
      readonly ruta: "proveedor" | "taller";
      readonly rol_decisor?: "carpinteria" | "oficina" | "tecnica";
    }
  | {
      readonly tipo: "dictamen";
      readonly dictamen: "aceptada" | "rechazada" | "sin_falla";
    }
  | {
      readonly tipo: "cambio-fisico";
      readonly rol_decisor?: "carpinteria" | "oficina" | "tecnica";
    }
  | {
      readonly tipo: "desenlace";
      readonly desenlace:
        | "reparado"
        | "reemplazado"
        | "devuelto"
        | "segunda_mano"
        | "desarmado"
        | "merma";
      readonly rol_decisor?: "carpinteria" | "oficina" | "tecnica";
    };

export type SolicitudComandoFolio =
  | {
      readonly tipo: "listo-entrega";
    }
  | {
      readonly tipo: "cancelar";
      readonly motivo: string;
    }
  | {
      readonly tipo: "cerrar";
      readonly justificacion_desvio?: string;
    };
