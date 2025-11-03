// Tipos básicos
export interface TraspasoDetalleRequest {
  articuloId: number;
  claveArticulo?: string;
  unidades: number;
}

export interface CrearTraspasoRequest {
  almacenOrigenId: number;
  almacenDestinoId: number;
  fecha?: Date | string;
  descripcion?: string;
  usuario?: string;
  detalles: TraspasoDetalleRequest[];
}

export interface TraspasoMovimiento {
  ARTICULO_ID: number;
  CLAVE_ARTICULO: string;
  UNIDADES: number;
  COSTO_UNITARIO: number;
  COSTO_TOTAL: number;
  TIPO_MOVTO: "S" | "E";
}

export interface TraspasoDetalle {
  DOCTO_IN_ID: number;
  ALMACEN_ID: number;
  ALMACEN_DESTINO_ID: number;
  FECHA: Date | string;
  DESCRIPCION?: string;
  salidas: TraspasoMovimiento[];
  entradas: TraspasoMovimiento[];
  detallesCompletos: TraspasoMovimiento[];
}

export interface Traspaso {
  DOCTO_IN_ID: number;
  ALMACEN_ID: number;
  ALMACEN_DESTINO_ID: number;
  FECHA: Date | string;
  DESCRIPCION?: string;
  USUARIO?: string;
}

export interface ArticuloCosto {
  articuloId: number;
  costoUnitario: number;
}

export interface CostosRequest {
  almacenId: number;
  articulosIds: number[];
}

export interface Articulo {
  ARTICULO_ID: number;
  CLAVE_ARTICULO: string;
  DESCRIPCION: string;
  EXISTENCIAS?: number;
  COSTO_UNITARIO?: number;
}

export interface FiltrosTraspasos {
  fechaInicio?: string;
  fechaFin?: string;
  almacenOrigenId?: number;
  almacenDestinoId?: number;
}
