import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialNotifications, Notification } from '../data/notifications';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  );

  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
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
