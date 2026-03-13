import { BaseNotification, NuevaVentaPayload, NotificationType } from '../../types/notifications';
import { v4 as uuidv4 } from 'uuid';

function transformNuevaVenta(payload: NuevaVentaPayload): BaseNotification {
  const precio = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(payload.precioTotal);

  return {
    id: uuidv4(),
    type: 'nueva_venta',
    timestamp: payload.timestamp || new Date().toISOString(),
    read: false,
    title: 'Nueva venta registrada',
    body: `${payload.nombreCliente} — ${precio} (${payload.tipoVenta})`,
    data: payload as unknown as Record<string, unknown>,
  };
}

export const transformers: Record<string, (payload: any) => BaseNotification> = {
  nueva_venta: transformNuevaVenta,
};

export const supportedEvents: NotificationType[] = Object.keys(transformers) as NotificationType[];
