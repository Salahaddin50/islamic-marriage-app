import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, auth } from '../config/supabase';
import RegistrationService from '../services/registration.service';
import IslamicMarriageService from '../services/islamic-marriage.service';
import { UserWithProfile } from '../types/database.types';
import { Session, User } from '@supabase/supabase-js';

// Types
interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  userProfile: UserWithProfile | null;
  session: Session | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    userProfile: null,
    session: null
  });

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          await handleUserSession(session);
        } else {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            userProfile: null,
            session: null
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      const { session, error } = await auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (session?.user) {
        await handleUserSession(session);
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false 
        }));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle user session
  const handleUserSession = async (session: Session) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Get complete user profile
      const userProfile = await IslamicMarriageService.getCompleteIslamicProfile(session.user.id);

      if (userProfile) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: session.user,
          userProfile,
          session
        });
      } else {
        // User exists but no profile - should redirect to complete registration
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: session.user,
          userProfile: null,
          session
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        userProfile: null,
        session
      });
    }
  };

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const result = await RegistrationService.signInUser(email, password);

      if (result.success && result.data) {
        // Auth state will be updated via onAuthStateChange
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: false, 
          error: result.error || 'Sign in failed' 
        };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await auth.signUp(email, password);

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: error.message };
      }

      if (data.user) {
        // User created but needs to complete profile
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Sign up failed' };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }

      // Auth state will be updated via onAuthStateChange
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Refresh Profile
  const refreshProfile = async () => {
    if (!authState.user) return;

    try {
      const userProfile = await IslamicMarriageService.getCompleteIslamicProfile(authState.user.id);
      
      setAuthState(prev => ({
        ...prev,
        userProfile
      }));
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  // Update Profile
  const updateProfile = async (updates: any) => {
    if (!authState.user || !authState.userProfile) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      // Update profile in database
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authState.userProfile.user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh profile data
      await refreshProfile();

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Hook for auth state only
export const useAuthState = (): AuthState => {
  const { isLoading, isAuthenticated, user, userProfile, session } = useAuth();
  
  return {
    isLoading,
    isAuthenticated,
    user,
    userProfile,
    session
  };
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuthState();
    
    if (isLoading) {
      // Return loading component
      return null; // or a loading spinner
    }
    
    if (!isAuthenticated) {
      // Redirect to login or return unauthorized component
      return null; // or redirect logic
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;
