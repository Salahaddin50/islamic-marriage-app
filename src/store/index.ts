// ============================================================================
// ENTERPRISE STATE MANAGEMENT - HUME DATING APP
// ============================================================================
// Zustand-based state management with TypeScript, persistence, and DevTools
// Follows enterprise patterns for scalability and maintainability
// ============================================================================

import { create } from 'zustand';
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  AppState, 
  AuthState, 
  UserState, 
  MatchState, 
  ChatState, 
  DiscoveryState,
  NotificationState,
  UIState,
  User,
  AuthUser,
  AuthTokens,
  Match,
  ChatRoom,
  PushNotification,
} from '../types';

// ================================
// ZUSTAND STORE INTERFACES
// ================================

interface AuthActions {
  login: (user: AuthUser, tokens: AuthTokens) => void;
  logout: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

interface UserActions {
  setProfile: (profile: User) => void;
  updateProfile: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

interface MatchActions {
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  removeMatch: (matchId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
}

interface ChatActions {
  setRooms: (rooms: ChatRoom[]) => void;
  addRoom: (room: ChatRoom) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  setActiveRoom: (roomId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface DiscoveryActions {
  setCandidates: (candidates: User[]) => void;
  addCandidates: (candidates: User[]) => void;
  removeCandidate: (index: number) => void;
  setCurrentIndex: (index: number) => void;
  nextCandidate: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
}

interface NotificationActions {
  setNotifications: (notifications: PushNotification[]) => void;
  addNotification: (notification: PushNotification) => void;
  markAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (key: string, loading: boolean) => void;
  showModal: (modalId: string) => void;
  hideModal: (modalId: string) => void;
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
}

// ================================
// COMBINED STORE TYPES
// ================================

type AuthStore = AuthState & AuthActions;
type UserStore = UserState & UserActions;
type MatchStore = MatchState & MatchActions;
type ChatStore = ChatState & ChatActions;
type DiscoveryStore = DiscoveryState & DiscoveryActions;
type NotificationStore = NotificationState & NotificationActions;
type UIStore = UIState & UIActions;

// ================================
// AUTHENTICATION STORE
// ================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial State
          isAuthenticated: false,
          user: null,
          tokens: null,
          loading: false,
          error: null,

          // Actions
          login: (user: AuthUser, tokens: AuthTokens) => {
            set((state) => {
              state.isAuthenticated = true;
              state.user = user;
              state.tokens = tokens;
              state.loading = false;
              state.error = null;
            });
          },

          logout: () => {
            set((state) => {
              state.isAuthenticated = false;
              state.user = null;
              state.tokens = null;
              state.loading = false;
              state.error = null;
            });
          },

          updateTokens: (tokens: AuthTokens) => {
            set((state) => {
              state.tokens = tokens;
            });
          },

          setLoading: (loading: boolean) => {
            set((state) => {
              state.loading = loading;
            });
          },

          setError: (error: string | null) => {
            set((state) => {
              state.error = error;
              state.loading = false;
            });
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },
        }))
      ),
      {
        name: 'hume-auth-store',
        storage: {
          getItem: (name) => AsyncStorage.getItem(name),
          setItem: (name, value) => AsyncStorage.setItem(name, value),
          removeItem: (name) => AsyncStorage.removeItem(name),
        },
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          tokens: state.tokens,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// ================================
// USER PROFILE STORE
// ================================

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial State
          profile: null,
          preferences: null,
          loading: false,
          error: null,

          // Actions
          setProfile: (profile: User) => {
            set((state) => {
              state.profile = profile;
              state.preferences = profile.preferences;
              state.loading = false;
              state.error = null;
            });
          },

          updateProfile: (updates: Partial<User>) => {
            set((state) => {
              if (state.profile) {
                Object.assign(state.profile, updates);
                if (updates.preferences) {
                  state.preferences = updates.preferences;
                }
              }
            });
          },

          setLoading: (loading: boolean) => {
            set((state) => {
              state.loading = loading;
            });
          },

          setError: (error: string | null) => {
            set((state) => {
              state.error = error;
              state.loading = false;
            });
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },
        }))
      ),
      {
        name: 'hume-user-store',
        storage: {
          getItem: (name) => AsyncStorage.getItem(name),
          setItem: (name, value) => AsyncStorage.setItem(name, value),
          removeItem: (name) => AsyncStorage.removeItem(name),
        },
      }
    ),
    { name: 'user-store' }
  )
);

// ================================
// MATCHES STORE
// ================================

export const useMatchStore = create<MatchStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        matches: [],
        loading: false,
        error: null,
        hasMore: true,

        // Actions
        setMatches: (matches: Match[]) => {
          set((state) => {
            state.matches = matches;
            state.loading = false;
            state.error = null;
          });
        },

        addMatch: (match: Match) => {
          set((state) => {
            const existingIndex = state.matches.findIndex(m => m.id === match.id);
            if (existingIndex >= 0) {
              state.matches[existingIndex] = match;
            } else {
              state.matches.unshift(match);
            }
          });
        },

        removeMatch: (matchId: string) => {
          set((state) => {
            state.matches = state.matches.filter(m => m.id !== matchId);
          });
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
            state.loading = false;
          });
        },

        setHasMore: (hasMore: boolean) => {
          set((state) => {
            state.hasMore = hasMore;
          });
        },
      }))
    ),
    { name: 'match-store' }
  )
);

// ================================
// CHAT STORE
// ================================

export const useChatStore = create<ChatStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        rooms: [],
        activeRoom: null,
        loading: false,
        error: null,

        // Actions
        setRooms: (rooms: ChatRoom[]) => {
          set((state) => {
            state.rooms = rooms;
            state.loading = false;
            state.error = null;
          });
        },

        addRoom: (room: ChatRoom) => {
          set((state) => {
            const existingIndex = state.rooms.findIndex(r => r.id === room.id);
            if (existingIndex >= 0) {
              state.rooms[existingIndex] = room;
            } else {
              state.rooms.unshift(room);
            }
          });
        },

        updateRoom: (roomId: string, updates: Partial<ChatRoom>) => {
          set((state) => {
            const roomIndex = state.rooms.findIndex(r => r.id === roomId);
            if (roomIndex >= 0) {
              Object.assign(state.rooms[roomIndex], updates);
            }
          });
        },

        setActiveRoom: (roomId: string | null) => {
          set((state) => {
            state.activeRoom = roomId;
          });
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
            state.loading = false;
          });
        },
      }))
    ),
    { name: 'chat-store' }
  )
);

// ================================
// DISCOVERY STORE
// ================================

export const useDiscoveryStore = create<DiscoveryStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        candidates: [],
        currentIndex: 0,
        loading: false,
        error: null,
        hasMore: true,

        // Actions
        setCandidates: (candidates: User[]) => {
          set((state) => {
            state.candidates = candidates;
            state.currentIndex = 0;
            state.loading = false;
            state.error = null;
          });
        },

        addCandidates: (candidates: User[]) => {
          set((state) => {
            state.candidates.push(...candidates);
            state.loading = false;
          });
        },

        removeCandidate: (index: number) => {
          set((state) => {
            state.candidates.splice(index, 1);
            if (state.currentIndex >= state.candidates.length && state.currentIndex > 0) {
              state.currentIndex = state.candidates.length - 1;
            }
          });
        },

        setCurrentIndex: (index: number) => {
          set((state) => {
            state.currentIndex = Math.max(0, Math.min(index, state.candidates.length - 1));
          });
        },

        nextCandidate: () => {
          set((state) => {
            if (state.currentIndex < state.candidates.length - 1) {
              state.currentIndex += 1;
            }
          });
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
            state.loading = false;
          });
        },

        setHasMore: (hasMore: boolean) => {
          set((state) => {
            state.hasMore = hasMore;
          });
        },
      }))
    ),
    { name: 'discovery-store' }
  )
);

// ================================
// NOTIFICATION STORE
// ================================

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,

        // Actions
        setNotifications: (notifications: PushNotification[]) => {
          set((state) => {
            state.notifications = notifications;
            state.unreadCount = notifications.filter(n => !n.readAt).length;
            state.loading = false;
            state.error = null;
          });
        },

        addNotification: (notification: PushNotification) => {
          set((state) => {
            state.notifications.unshift(notification);
            if (!notification.readAt) {
              state.unreadCount += 1;
            }
          });
        },

        markAsRead: (notificationId: string) => {
          set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification && !notification.readAt) {
              notification.readAt = new Date().toISOString();
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          });
        },

        removeNotification: (notificationId: string) => {
          set((state) => {
            const index = state.notifications.findIndex(n => n.id === notificationId);
            if (index >= 0) {
              const notification = state.notifications[index];
              if (!notification.readAt) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              state.notifications.splice(index, 1);
            }
          });
        },

        setUnreadCount: (count: number) => {
          set((state) => {
            state.unreadCount = Math.max(0, count);
          });
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
            state.loading = false;
          });
        },
      }))
    ),
    { name: 'notification-store' }
  )
);

// ================================
// UI STORE
// ================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial State
          theme: 'system' as const,
          loading: {},
          modals: {},
          errors: {},

          // Actions
          setTheme: (theme: 'light' | 'dark' | 'system') => {
            set((state) => {
              state.theme = theme;
            });
          },

          setLoading: (key: string, loading: boolean) => {
            set((state) => {
              state.loading[key] = loading;
            });
          },

          showModal: (modalId: string) => {
            set((state) => {
              state.modals[modalId] = true;
            });
          },

          hideModal: (modalId: string) => {
            set((state) => {
              state.modals[modalId] = false;
            });
          },

          setError: (key: string, error: string | null) => {
            set((state) => {
              state.errors[key] = error;
            });
          },

          clearError: (key: string) => {
            set((state) => {
              delete state.errors[key];
            });
          },

          clearAllErrors: () => {
            set((state) => {
              state.errors = {};
            });
          },
        }))
      ),
      {
        name: 'hume-ui-store',
        storage: {
          getItem: (name) => AsyncStorage.getItem(name),
          setItem: (name, value) => AsyncStorage.setItem(name, value),
          removeItem: (name) => AsyncStorage.removeItem(name),
        },
        partialize: (state) => ({
          theme: state.theme,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);

// ================================
// STORE UTILITIES & SELECTORS
// ================================

// Computed selectors for common use cases
export const useAuthSelectors = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.loading);
  const error = useAuthStore(state => state.error);
  
  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    hasError: !!error,
  };
};

export const useUserSelectors = () => {
  const profile = useUserStore(state => state.profile);
  const preferences = useUserStore(state => state.preferences);
  const isLoading = useUserStore(state => state.loading);
  
  return {
    profile,
    preferences,
    isLoading,
    hasProfile: !!profile,
    isProfileComplete: profile ? (
      !!profile.profile.firstName &&
      !!profile.profile.dateOfBirth &&
      profile.profile.photos.length > 0
    ) : false,
  };
};

export const useDiscoverySelectors = () => {
  const candidates = useDiscoveryStore(state => state.candidates);
  const currentIndex = useDiscoveryStore(state => state.currentIndex);
  const hasMore = useDiscoveryStore(state => state.hasMore);
  
  return {
    candidates,
    currentIndex,
    hasMore,
    currentCandidate: candidates[currentIndex] || null,
    remainingCandidates: candidates.length - currentIndex - 1,
    hasRemainingCandidates: currentIndex < candidates.length - 1,
  };
};

// Store reset utility for logout
export const resetAllStores = () => {
  useMatchStore.getState().setMatches([]);
  useChatStore.getState().setRooms([]);
  useDiscoveryStore.getState().setCandidates([]);
  useNotificationStore.getState().setNotifications([]);
  useUIStore.getState().clearAllErrors();
};

// ================================
// STORE SUBSCRIPTIONS
// ================================

// Subscribe to auth changes to reset other stores on logout
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated, previousIsAuthenticated) => {
    if (previousIsAuthenticated && !isAuthenticated) {
      resetAllStores();
    }
  }
);

// Export store types for use in components
export type {
  AuthStore,
  UserStore,
  MatchStore,
  ChatStore,
  DiscoveryStore,
  NotificationStore,
  UIStore,
};
