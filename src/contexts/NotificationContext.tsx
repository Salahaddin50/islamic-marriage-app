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

  // Get current user and load initial data with cache warming
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Try to load from cache first for instant display
          try {
            const cachedNotifications = localStorage.getItem(`notifications_${user.id}`);
            const cachedCount = localStorage.getItem(`unread_count_${user.id}`);
            
            if (cachedNotifications && cachedCount) {
              const notifications = JSON.parse(cachedNotifications);
              const count = parseInt(cachedCount);
              
              // Only use cache if it's less than 5 minutes old
              const cacheTime = localStorage.getItem(`notifications_cache_time_${user.id}`);
              const isRecentCache = cacheTime && (Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000;
              
              if (isRecentCache && Array.isArray(notifications)) {
                console.log('Loading notifications from cache');
                setNotifications(notifications);
                setUnreadCount(count);
                setIsLoading(false);
                
                // Still fetch fresh data in background
                loadNotifications(user.id).then(() => {
                  console.log('Background refresh completed');
                });
                return;
              }
            }
          } catch (error) {
            console.log('Cache loading failed, fetching fresh data:', error);
          }
          
          // Load fresh data if no valid cache
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

    console.log('Setting up real-time notification subscription for user:', currentUserId);
    
    const subscription = NotificationsService.subscribeToNotifications(
      currentUserId,
      (notification) => {
        console.log('Real-time notification received:', notification);
        setNotifications(prev => {
          // Avoid duplicates by checking if notification already exists
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('Notification already exists, skipping duplicate');
            return prev;
          }
          const updatedNotifications = [notification, ...prev];
          
          // Update cache with new notification
          if (currentUserId) {
            try {
              localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(updatedNotifications));
              localStorage.setItem(`notifications_cache_time_${currentUserId}`, Date.now().toString());
            } catch (error) {
              console.log('Failed to cache new notification:', error);
            }
          }
          
          return updatedNotifications;
        });
        setUnreadCount(prev => {
          const newCount = prev + 1;
          // Update cache with new count
          if (currentUserId) {
            try {
              localStorage.setItem(`unread_count_${currentUserId}`, newCount.toString());
            } catch (error) {
              console.log('Failed to cache new unread count:', error);
            }
          }
          return newCount;
        });
        showNotificationPopup(notification);
      }
    );

    // Add error handling for subscription
    subscription.on('system', {}, (payload) => {
      console.log('Subscription system event:', payload);
      if (payload.status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to notifications');
      } else if (payload.status === 'CHANNEL_ERROR') {
        console.error('Notification subscription error:', payload);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          console.log('Attempting to reconnect notification subscription...');
          if (currentUserId) {
            // Force a refresh to ensure we have the latest data
            loadNotifications(currentUserId);
          }
        }, 5000);
      }
    });

    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(subscription);
    };
  }, [currentUserId]);

  const loadNotifications = async (userId: string, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    
    try {
      console.log('Loading notifications for user:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
      
      const [notificationData, count] = await Promise.all([
        NotificationsService.getForUser(userId),
        NotificationsService.getUnreadCount(userId)
      ]);
      
      console.log('Loaded notifications:', notificationData.length, 'Unread count:', count);
      
      setNotifications(notificationData);
      setUnreadCount(count);
      
      // Cache the data for faster subsequent loads
      try {
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notificationData));
        localStorage.setItem(`unread_count_${userId}`, count.toString());
        localStorage.setItem(`notifications_cache_time_${userId}`, Date.now().toString());
      } catch (error) {
        console.log('Failed to cache notifications:', error);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      
      // Retry with exponential backoff if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`Retrying notification load in ${retryDelay}ms...`);
        setTimeout(() => {
          loadNotifications(userId, retryCount + 1);
        }, retryDelay);
      } else {
        console.error('Max retries exceeded for loading notifications');
        // Set error state but don't crash the app
        setNotifications([]);
        setUnreadCount(0);
      }
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
      
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      const newUnreadCount = Math.max(0, unreadCount - 1);
      
      setNotifications(updatedNotifications);
      setUnreadCount(newUnreadCount);
      
      // Update cache
      if (currentUserId) {
        try {
          localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(updatedNotifications));
          localStorage.setItem(`unread_count_${currentUserId}`, newUnreadCount.toString());
          localStorage.setItem(`notifications_cache_time_${currentUserId}`, Date.now().toString());
        } catch (error) {
          console.log('Failed to update notification cache:', error);
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [notifications, unreadCount, currentUserId]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      await NotificationsService.markAllAsRead(currentUserId);
      
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Update cache
      try {
        localStorage.setItem(`notifications_${currentUserId}`, JSON.stringify(updatedNotifications));
        localStorage.setItem(`unread_count_${currentUserId}`, '0');
        localStorage.setItem(`notifications_cache_time_${currentUserId}`, Date.now().toString());
      } catch (error) {
        console.log('Failed to update notification cache:', error);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [currentUserId, notifications]);

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
