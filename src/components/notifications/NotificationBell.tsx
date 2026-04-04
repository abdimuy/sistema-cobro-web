import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, Shield, ArrowLeftRight, Info, CheckCheck, Trash2, DollarSign, Package, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';
import { BaseNotification, NotificationType, NuevaVentaPayload } from '../../types/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const typeConfig: Record<NotificationType, { color: string; icon: React.ReactNode }> = {
  nueva_venta: {
    color: 'bg-blue-100 text-blue-600',
    icon: <ShoppingCart className="size-4" />,
  },
  garantia: {
    color: 'bg-amber-100 text-amber-600',
    icon: <Shield className="size-4" />,
  },
  traspaso: {
    color: 'bg-green-100 text-green-600',
    icon: <ArrowLeftRight className="size-4" />,
  },
  sistema: {
    color: 'bg-gray-100 text-gray-600',
    icon: <Info className="size-4" />,
  },
};

const notificationRoutes: Partial<Record<NotificationType, (data: Record<string, unknown>) => string>> = {
  nueva_venta: (data) => `/ventas-locales?ventaId=${data.localSaleId}`,
};

function VentaDetails({ data }: { data: Record<string, unknown> }) {
  const payload = data as unknown as NuevaVentaPayload;
  const precio = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(payload.precioTotal);
  const vendedores = payload.vendedoresNombres?.length
    ? payload.vendedoresNombres.join(', ')
    : payload.vendedoresEmails?.map((e) => e.split('@')[0]).join(', ');

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <DollarSign className="size-3" />{precio}
      </span>
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Package className="size-3" />{payload.productos} prod.
      </span>
      {payload.vendedoresNombres?.length ? (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="size-3 flex-shrink-0" />
          {payload.vendedoresNombres.length === 1
            ? payload.vendedoresNombres[0]
            : `${payload.vendedoresNombres.length} vendedores`}
        </span>
      ) : vendedores ? (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[180px]">
          <User className="size-3 flex-shrink-0" />{vendedores}
        </span>
      ) : null}
    </div>
  );
}

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
      className={`w-full text-left px-3 py-2.5 transition-colors ${
        notification.read
          ? 'opacity-50'
          : 'hover:bg-accent'
      } ${hasRoute ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.color} rounded-lg p-2 flex-shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm truncate ${notification.read ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
              {notification.title}
            </p>
            {!notification.read && <span className="size-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {notification.body}
          </p>

          {notification.type === 'nueva_venta' && (
            <VentaDetails data={notification.data} />
          )}

          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-muted-foreground/70">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: es })}
            </p>
            {hasRoute && (
              <span className="text-[11px] text-primary font-medium">Ver detalle →</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: BaseNotification) => {
    markAsRead(notification.id);
    const routeBuilder = notificationRoutes[notification.type];
    if (routeBuilder) {
      const route = routeBuilder(notification.data);
      setOpen(false);
      navigate(route);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-9">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px] font-bold"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
                <span
                  className={`absolute bottom-1 right-1 size-2 rounded-full ring-2 ring-background ${
                    isConnected ? 'bg-green-500' : 'bg-red-400'
                  }`}
                />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {isConnected ? 'Notificaciones' : 'Sin conexión'}
              {unreadCount > 0 && ` (${unreadCount} sin leer)`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notificaciones</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs text-muted-foreground gap-1"
              >
                <CheckCheck className="size-3" />
                Leer todo
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs text-muted-foreground gap-1"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="size-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Sin notificaciones</p>
            <p className="text-xs mt-1 opacity-70">Las nuevas aparecerán aquí</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
