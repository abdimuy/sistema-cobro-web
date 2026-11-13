export interface ArticuloGarantia {
  readonly id: string;
  readonly garantia_id: string;
  readonly rol: string;
  readonly clave: string;
  readonly description: string;
  readonly ruta?: string;
  readonly etapa: string;
  readonly ubicacion: string;
  readonly dictamen?: string;
  readonly desenlace?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Garantia {
  readonly id: string;
  readonly folio: string;
  readonly origen: string;
  readonly cliente_id?: number;
  readonly venta_id?: number;
  readonly estado_cuenta?: string;
  readonly estado: string;
  readonly description: string;
  readonly abierto_por: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly articulos: readonly ArticuloGarantia[];
}

export interface ImagenGarantia {
  readonly id: string;
  readonly created_at: string;
}

export interface EventoGarantia {
  readonly id: string;
  readonly garantia_id: string;
  readonly articulo_ref?: string;
  readonly tipo: string;
  readonly description: string;
  readonly usuario: string;
  readonly rol_decisor?: string;
  readonly gps_lat?: number;
  readonly gps_lon?: number;
  readonly created_at: string;
  readonly device_created_at: string;
  readonly clave_idempotencia: string;
  readonly distancia_entrega_m?: number;
  readonly auditoria_gps?: string;
  readonly imagenes: readonly ImagenGarantia[];
}

export interface PaginaGarantias {
  readonly items: readonly Garantia[];
  readonly next_cursor: string;
  readonly has_more: boolean;
}

export interface DetalleGarantia {
  readonly garantia: Garantia;
  readonly eventos: readonly EventoGarantia[];
}

export interface FiltrosGarantias {
  readonly estado?: string;
  readonly origen?: string;
  readonly cliente_id?: number;
  readonly etapa?: string;
  readonly ubicacion?: string;
  readonly desde?: string;
  readonly hasta?: string;
}
