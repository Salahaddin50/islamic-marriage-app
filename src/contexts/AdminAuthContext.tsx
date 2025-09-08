import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AdminAuthService, { AdminUser, AdminSession, AdminAuthState } from '../services/admin-auth.service';

interface AdminAuthContextType extends AdminAuthState {
  signInWithEmail: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    needsApproval?: boolean;
  }>;
  registerWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<{
    success: boolean;
    error?: string;
    needsApproval?: boolean;
  }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isSuperAdmin: () => boolean;
  approveAdmin: (adminId: string) => Promise<{ success: boolean; error?: string }>;
  rejectAdmin: (adminId: string) => Promise<{ success: boolean; error?: string }>;
  getPendingAdmins: () => Promise<{ success: boolean; data?: AdminUser[]; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    session: null,
    error: null
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const state = await AdminAuthService.initializeAuth();
      setAuthState(state);
    } catch (error) {
      console.error('Admin auth initialization error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: 'Failed to initialize authentication'
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await AdminAuthService.signInWithEmail(email, password);
      
      if (result.success && result.user && result.session) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: result.user,
          session: result.session,
          error: null
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Sign in failed'
        }));
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Sign in failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const registerWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await AdminAuthService.registerWithEmail(email, password, firstName, lastName);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || null
      }));
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await AdminAuthService.signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear the state even if sign out fails
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: null
      });
    }
  };

  const refreshAuth = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await initializeAuth();
  };

  const isSuperAdmin = (): boolean => {
    return AdminAuthService.isSuperAdmin();
  };

  const approveAdmin = async (adminId: string) => {
    const result = await AdminAuthService.approveAdmin(adminId);
    if (result.success) {
      // Optionally refresh state or update local state
    }
    return result;
  };

  const rejectAdmin = async (adminId: string) => {
    const result = await AdminAuthService.rejectAdmin(adminId);
    if (result.success) {
      // Optionally refresh state or update local state
    }
    return result;
  };

  const getPendingAdmins = async () => {
    return await AdminAuthService.getPendingAdmins();
  };

  const contextValue: AdminAuthContextType = {
    ...authState,
    signInWithEmail,
    registerWithEmail,
    signOut,
    refreshAuth,
    isSuperAdmin,
    approveAdmin,
    rejectAdmin,
    getPendingAdmins
  };

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
