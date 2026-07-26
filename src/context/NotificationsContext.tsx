import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Notification } from '../data/notifications';
import { useUser } from './UserContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from '../lib/database';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

function toNotification(row: any): Notification {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    unread: !row.read_at,
  };
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { userId, isGuest } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId || isGuest) {
      setNotifications([]);
      return;
    }

    let isMounted = true;

    getNotifications(userId).then((result) => {
      if (isMounted && !result.error) {
        setNotifications((result.data || []).map(toNotification));
      }
    });

    const channel = subscribeToNotifications(userId, (payload) => {
      if (!isMounted || !payload.new) return;
      setNotifications((current) => [toNotification(payload.new), ...current]);
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [userId, isGuest]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  );

  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
    markNotificationAsRead(id);
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
    if (userId) {
      markAllNotificationsAsRead(userId);
    }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
