import React from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingCart, Shield, ArrowLeftRight, Info, X, User, Package, DollarSign, Tag } from 'lucide-react';
import { BaseNotification, NotificationType, NuevaVentaPayload } from '../../types/notifications';
import { appNavigate } from '../../lib/navigation';

const toastConfig: Record<NotificationType, { bg: string; accent: string; icon: React.ReactNode }> = {
  nueva_venta: {
    bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
    accent: 'bg-blue-500/30',
    icon: <ShoppingCart className="size-5 text-white" />,
  },
  garantia: {
    bg: 'bg-gradient-to-br from-amber-600 to-amber-700',
    accent: 'bg-amber-500/30',
    icon: <Shield className="size-5 text-white" />,
  },
  traspaso: {
    bg: 'bg-gradient-to-br from-green-600 to-green-700',
    accent: 'bg-green-500/30',
    icon: <ArrowLeftRight className="size-5 text-white" />,
  },
  sistema: {
    bg: 'bg-gradient-to-br from-gray-600 to-gray-700',
    accent: 'bg-gray-500/30',
    icon: <Info className="size-5 text-white" />,
  },
};

const notificationRoutes: Partial<Record<NotificationType, (data: Record<string, unknown>) => string>> = {
  nueva_venta: (data) => `/ventas-locales?ventaId=${data.localSaleId}`,
};

function NuevaVentaDetails({ data }: { data: Record<string, unknown> }) {
  const payload = data as unknown as NuevaVentaPayload;

  const precio = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(payload.precioTotal);

  const nombres = payload.vendedoresNombres?.length
    ? payload.vendedoresNombres
    : payload.vendedoresEmails?.map((email) => email.split('@')[0]);

  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <DollarSign className="size-3 text-white/50 flex-shrink-0" />
          <span className="text-white font-semibold text-xs">{precio}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Tag className="size-3 text-white/50 flex-shrink-0" />
          <span className="text-white/80 text-xs truncate">{payload.tipoVenta}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Package className="size-3 text-white/50 flex-shrink-0" />
          <span className="text-white/80 text-xs">
            {payload.productos} prod.
          </span>
        </div>
      </div>
      {nombres && nombres.length > 0 && (
        <div className="flex items-start gap-1.5 mt-1">
          <User className="size-3 text-white/50 flex-shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
            {nombres.map((nombre, i) => (
              <span key={i} className="text-white/80 text-xs bg-white/10 rounded px-1.5 py-0.5">
                {nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function renderToastContent(notification: BaseNotification, toastId: string | number): React.ReactElement {
  const config = toastConfig[notification.type] || toastConfig.sistema;
  const routeBuilder = notificationRoutes[notification.type];
  const isClickable = !!routeBuilder;

  const handleClick = () => {
    if (routeBuilder) {
      const route = routeBuilder(notification.data);
      appNavigate(route);
    }
    toast.dismiss(toastId);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.dismiss(toastId);
  };

  return (
    <div
      className={`${config.bg} rounded-xl shadow-2xl w-[420px] text-white ${isClickable ? 'cursor-pointer' : ''} relative group`}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 size-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="size-3.5 text-white" />
      </button>

      <div className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className={`${config.accent} rounded-lg p-2.5 flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{notification.title}</p>
            <p className="text-white/70 text-xs mt-0.5">{notification.body}</p>

            {notification.type === 'nueva_venta' && (
              <NuevaVentaDetails data={notification.data} />
            )}

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10">
              <p className="text-white/40 text-[10px] font-medium uppercase tracking-wide">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: es })}
              </p>
              {isClickable && (
                <span className="text-[11px] text-white/60 font-medium group-hover:text-white/90 transition-colors">
                  Ver detalle →
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
