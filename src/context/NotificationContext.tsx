import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import useGetUser from '../hooks/useGetUser';
import { SSEClient } from '../services/sse/SSEClient';
import { BaseNotification } from '../types/notifications';
import { transformers, supportedEvents } from '../services/notifications/notificationTransformers';
import { showNativeNotification } from '../services/notifications/nativeNotification';
import { SSE_NOTIFICATIONS_URL } from '../constants/api';
import { enable as enableAutostart } from '@tauri-apps/plugin-autostart';
import { renderToastContent } from '../components/notifications/NotificationToast';

const MAX_NOTIFICATIONS = 50;

interface NotificationContextValue {
  notifications: BaseNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  reconnect: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userData, user } = useAuth();
  const { user: firestoreUser } = useGetUser(user?.uid);
  const [notifications, setNotifications] = useState<BaseNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const sseRef = useRef<SSEClient | null>(null);
  const isFirstLoad = useRef(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Enable autostart once on mount
  useEffect(() => {
    enableAutostart().catch(() => {});
  }, []);

  const handleSSEEvent = useCallback(
    (eventType: string, payload: unknown) => {
      const transformer = transformers[eventType];
      if (!transformer) return;

      const notification = transformer(payload);

      // Don't notify yourself
      const eventData = payload as Record<string, unknown>;
      if (eventData.userEmail && eventData.userEmail === userData?.EMAIL) return;

      setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));

      showNativeNotification(notification.title, notification.body);
      toast.custom((t) => renderToastContent(notification, t), { duration: 5000 });
    },
    [userData?.EMAIL]
  );

  useEffect(() => {
    if (!isAuthenticated || !userData) {
      // Cleanup on logout
      if (sseRef.current) {
        sseRef.current.disconnect();
        sseRef.current = null;
      }
      setIsConnected(false);
      setNotifications([]);
      return;
    }

    const sseUrl = `${SSE_NOTIFICATIONS_URL}?email=${encodeURIComponent(userData.EMAIL)}`;
    const client = new SSEClient(sseUrl, {
      onConnected: () => setIsConnected(true),
      onDisconnected: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    for (const eventType of supportedEvents) {
      client.addEventListener(eventType, (payload: unknown) => {
        handleSSEEvent(eventType, payload);
      });
    }

    client.connect();
    sseRef.current = client;

    return () => {
      client.disconnect();
      sseRef.current = null;
    };
  }, [isAuthenticated, userData, handleSSEEvent]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const reconnect = useCallback(() => {
    if (!userData) return;
    if (sseRef.current) {
      sseRef.current.disconnect();
      sseRef.current = null;
    }

    const sseUrl = `${SSE_NOTIFICATIONS_URL}?email=${encodeURIComponent(userData.EMAIL)}`;
    const client = new SSEClient(sseUrl, {
      onConnected: () => setIsConnected(true),
      onDisconnected: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    for (const eventType of supportedEvents) {
      client.addEventListener(eventType, (payload: unknown) => {
        handleSSEEvent(eventType, payload);
      });
    }

    client.connect();
    sseRef.current = client;
  }, [userData, handleSSEEvent]);

  // Reconectar SSE cuando cambia el doc del usuario en Firestore
  useEffect(() => {
    if (!firestoreUser) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    reconnect();
  }, [firestoreUser, reconnect]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isConnected, markAsRead, markAllAsRead, clearAll, reconnect }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
