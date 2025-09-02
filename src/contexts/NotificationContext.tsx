import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { NotificationsService, NotificationRecord } from '@/src/services/notifications';
import { supabase } from '@/src/config/supabase';
import { Platform, Vibration } from 'react-native';

interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  soundEnabled: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  setSoundEnabled: (enabled: boolean) => void;
  showNotificationPopup: (notification: NotificationRecord) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Popup refs
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user and load initial data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await loadNotifications(user.id);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUserId) return;

    const subscription = NotificationsService.subscribeToNotifications(
      currentUserId,
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        showNotificationPopup(notification);
      }
    );

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId]);

  const loadNotifications = async (userId: string) => {
    try {
      console.log('Loading notifications for user:', userId);
      
      const [notificationData, count] = await Promise.all([
        NotificationsService.getForUser(userId),
        NotificationsService.getUnreadCount(userId)
      ]);
      
      console.log('Loaded notifications:', notificationData.length, 'Unread count:', count);
      
      setNotifications(notificationData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const refreshNotifications = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      await loadNotifications(currentUserId);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationsService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      await NotificationsService.markAllAsRead(currentUserId);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [currentUserId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationsService.delete(notificationId);
      
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    // Store preference locally
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('hume_notification_sound', enabled ? '1' : '0');
      } catch (error) {
        console.log('Failed to store sound preference:', error);
      }
    }
  }, []);

  const showNotificationPopup = useCallback((notification: NotificationRecord) => {
    // Play sound if enabled
    if (soundEnabled) {
      if (Platform.OS === 'web') {
        // Web beep sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
          console.log('Web audio notification failed:', error);
        }
      } else {
        // Mobile vibration only (no sound dependency)
        try {
          Vibration.vibrate([200, 100, 200]);
        } catch (error) {
          console.log('Vibration failed:', error);
        }
      }
    }

    // Show popup notification (this would be implemented in the UI layer)
    // For now, we'll just trigger a custom event that can be listened to
    if (Platform.OS === 'web') {
      window.dispatchEvent(new CustomEvent('showNotificationPopup', { 
        detail: notification 
      }));
    }

    // Auto-hide after 3 seconds
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    
    popupTimeoutRef.current = setTimeout(() => {
      if (Platform.OS === 'web') {
        window.dispatchEvent(new CustomEvent('hideNotificationPopup'));
      }
    }, 3000);
  }, [soundEnabled]);

  // Load sound preference on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const stored = localStorage.getItem('hume_notification_sound');
        if (stored !== null) {
          setSoundEnabledState(stored === '1');
        }
      } catch (error) {
        console.log('Failed to load sound preference:', error);
      }
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    soundEnabled,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setSoundEnabled,
    showNotificationPopup
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
