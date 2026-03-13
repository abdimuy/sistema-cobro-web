export type NotificationType = 'nueva_venta' | 'garantia' | 'traspaso' | 'sistema';

export interface BaseNotification {
  id: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export interface NuevaVentaPayload {
  localSaleId: string;
  nombreCliente: string;
  precioTotal: number;
  tipoVenta: string;
  userEmail: string;
  productos: number;
  zonaClienteId: number | null;
  timestamp: string;
}

export interface SSEEventMap {
  nueva_venta: NuevaVentaPayload;
}
