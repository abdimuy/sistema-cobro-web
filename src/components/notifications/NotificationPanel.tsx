import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';
import { BaseNotification, NotificationType } from '../../types/notifications';

interface NotificationPanelProps {
  onClose: () => void;
}

const typeConfig: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
  nueva_venta: {
    bg: 'bg-blue-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  garantia: {
    bg: 'bg-amber-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  traspaso: {
    bg: 'bg-green-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  sistema: {
    bg: 'bg-gray-600',
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

function NotificationItem({
  notification,
  onClick,
}: {
  notification: BaseNotification;
  onClick: (notification: BaseNotification) => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.sistema;
  const hasRoute = notification.type in notificationRoutes;

  return (
    <button
      onClick={() => onClick(notification)}
      className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
        notification.read ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.bg} rounded-lg p-2 flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm truncate ${notification.read ? 'text-gray-500' : 'font-semibold text-gray-900'}`}>
              {notification.title}
            </p>
            {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: es })}
            </p>
            {hasRoute && (
              <span className="text-[10px] text-blue-500 font-medium">Ver venta →</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: BaseNotification) => {
    markAsRead(notification.id);

    const routeBuilder = notificationRoutes[notification.type];
    if (routeBuilder) {
      const route = routeBuilder(notification.data);
      onClose();
      navigate(route);
    }
  };

  return (
    <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-blue-600">
        <h3 className="font-semibold text-white text-sm">
          Notificaciones {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-100 hover:text-white font-medium"
            >
              Marcar todas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-blue-200 hover:text-white"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
