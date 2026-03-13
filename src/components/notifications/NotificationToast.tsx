import React from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { BaseNotification, NotificationType } from '../../types/notifications';
import { appNavigate } from '../../lib/navigation';

const toastConfig: Record<NotificationType, { bg: string; accent: string; icon: React.ReactNode }> = {
  nueva_venta: {
    bg: 'bg-blue-600',
    accent: 'bg-blue-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  garantia: {
    bg: 'bg-amber-600',
    accent: 'bg-amber-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  traspaso: {
    bg: 'bg-green-600',
    accent: 'bg-green-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  sistema: {
    bg: 'bg-gray-600',
    accent: 'bg-gray-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const notificationRoutes: Partial<Record<NotificationType, (data: Record<string, unknown>) => string>> = {
  nueva_venta: (data) => `/ventas-locales?ventaId=${data.localSaleId}`,
};

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
      className={`${config.bg} rounded-xl shadow-2xl w-[360px] text-white ${isClickable ? 'cursor-pointer' : ''} relative group`}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className={`${config.accent} rounded-lg p-2 flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{notification.title}</p>
            <p className="text-white/80 text-xs mt-1 leading-snug">{notification.body}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: es })}
              </p>
              {isClickable && (
                <span className="text-[10px] text-white/70 font-medium">Ver detalle →</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
