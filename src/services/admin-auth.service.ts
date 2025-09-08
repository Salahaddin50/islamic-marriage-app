import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  is_super_admin: boolean;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AdminSession {
  id: string;
  admin_user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  session: AdminSession | null;
  error: string | null;
}

class AdminAuthService {
  private static instance: AdminAuthService;
  private currentUser: AdminUser | null = null;
  private currentSession: AdminSession | null = null;

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * Initialize admin authentication by checking for existing session
   */
  async initializeAuth(): Promise<AdminAuthState> {
    try {
      const sessionToken = await this.getStoredSessionToken();
      
      if (!sessionToken) {
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: null
        };
      }

      // Validate session token
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        await this.clearStoredSession();
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: 'Session expired'
        };
      }

      // Get admin user details
      const { data: user, error: userError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.admin_user_id)
        .eq('is_approved', true)
        .single();

      if (userError || !user) {
        await this.clearStoredSession();
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
          error: 'Admin user not found or not approved'
        };
      }

      this.currentUser = user;
      this.currentSession = session;

      return {
        isAuthenticated: true,
        isLoading: false,
        user,
        session,
        error: null
      };

    } catch (error) {
      console.error('Admin auth initialization error:', error);
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: 'Authentication initialization failed'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<{
    success: boolean;
    user?: AdminUser;
    session?: AdminSession;
    error?: string;
    needsApproval?: boolean;
  }> {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // First, try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (authError) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      // Now check if admin user exists and is approved
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (adminError || !adminUser) {
        // Sign out from auth since they're not an admin
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'No admin account found for this email'
        };
      }

      if (!adminUser.is_approved) {
        // Sign out from auth since they're not approved
        await supabase.auth.signOut();
        return {
          success: false,
          needsApproval: true,
          error: 'Your admin account is pending approval. Please contact a super administrator.'
        };
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Create admin session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

      const { data: adminSession, error: sessionError } = await supabase
        .from('admin_sessions')
        .insert([{
          admin_user_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: await this.getClientIP(),
          user_agent: this.getUserAgent()
        }])
        .select()
        .single();

      if (sessionError) {
        return {
          success: false,
          error: 'Failed to create admin session'
        };
      }

      // Store session token
      await this.storeSessionToken(sessionToken);

      // Update current user and session
      this.currentUser = adminUser;
      this.currentSession = adminSession;

      // Log admin activity
      await this.logActivity('login', null, null, { ip: await this.getClientIP() });

      return {
        success: true,
        user: adminUser,
        session: adminSession
      };

    } catch (error: any) {
      console.error('Email sign in error:', error);
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  }

  /**
   * Register new admin with email and password
   */
  async registerWithEmail(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{
    success: boolean;
    user?: AdminUser;
    error?: string;
    needsApproval?: boolean;
  }> {
    try {
      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return {
          success: false,
          error: 'All fields are required'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters'
        };
      }

      // Check if admin user already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle(); // Use maybeSingle to avoid errors when no record found

      if (checkError) {
        console.error('Error checking existing admin:', checkError);
        
        // Check if it's a "table doesn't exist" error
        if (checkError.message?.includes('does not exist') || checkError.code === '42P01') {
          return {
            success: false,
            error: 'Admin system not set up. Please run the database migration first.'
          };
        }
        
        return {
          success: false,
          error: 'Database error. Please try again or contact support.'
        };
      }

      if (existingAdmin) {
        return {
          success: false,
          error: 'An admin with this email already exists'
        };
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          return {
            success: false,
            error: 'An account with this email already exists. Try signing in instead.'
          };
        }
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Create admin user record (don't set ID, let it auto-generate)
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          email: email.toLowerCase().trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          is_super_admin: false,
          is_approved: false // Needs approval from super admin
        }])
        .select()
        .single();

      if (adminError) {
        // Don't try to delete the auth user as we don't have admin privileges
        console.error('Failed to create admin profile:', adminError);
        return {
          success: false,
          error: 'Failed to create admin profile'
        };
      }

      return {
        success: true,
        user: adminUser,
        needsApproval: true
      };

    } catch (error: any) {
      console.error('Email registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }


  /**
   * Sign out admin user
   */
  async signOut(): Promise<void> {
    try {
      if (this.currentSession) {
        // Delete session from database
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', this.currentSession.session_token);

        // Log activity
        await this.logActivity('logout');
      }

      // Clear stored session
      await this.clearStoredSession();

      // Clear current state
      this.currentUser = null;
      this.currentSession = null;

      // Sign out from Supabase auth as well
      await supabase.auth.signOut();

    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Get current admin user
   */
  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  /**
   * Get current admin session
   */
  getCurrentSession(): AdminSession | null {
    return this.currentSession;
  }

  /**
   * Check if current user is super admin
   */
  isSuperAdmin(): boolean {
    return this.currentUser?.is_super_admin || false;
  }

  /**
   * Approve admin user (super admin only)
   */
  async approveAdmin(adminId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isSuperAdmin()) {
      return { success: false, error: 'Only super admins can approve other admins' };
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          is_approved: true,
          approved_by: this.currentUser!.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logActivity('approve_admin', 'admin_users', adminId, { approved_admin: data });

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject admin user (super admin only)
   */
  async rejectAdmin(adminId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isSuperAdmin()) {
      return { success: false, error: 'Only super admins can reject other admins' };
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logActivity('reject_admin', 'admin_users', adminId);

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending admin approvals (super admin only)
   */
  async getPendingAdmins(): Promise<{ success: boolean; data?: AdminUser[]; error?: string }> {
    if (!this.isSuperAdmin()) {
      return { success: false, error: 'Only super admins can view pending approvals' };
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log admin activity
   */
  async logActivity(
    action: string,
    targetTable?: string | null,
    targetId?: string | null,
    metadata?: any
  ): Promise<void> {
    if (!this.currentUser) return;

    try {
      await supabase
        .from('admin_activity_log')
        .insert([{
          admin_user_id: this.currentUser.id,
          action,
          target_table: targetTable,
          target_id: targetId,
          new_values: metadata ? { metadata } : null,
          ip_address: await this.getClientIP(),
          user_agent: this.getUserAgent()
        }]);
    } catch (error) {
      console.error('Failed to log admin activity:', error);
    }
  }

  // Private helper methods

  private generateSessionToken(): string {
    return 'admin_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async storeSessionToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('admin_session_token', token);
      } else {
        await AsyncStorage.setItem('admin_session_token', token);
      }
    } catch (error) {
      console.error('Failed to store session token:', error);
    }
  }

  private async getStoredSessionToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('admin_session_token');
      } else {
        return await AsyncStorage.getItem('admin_session_token');
      }
    } catch (error) {
      console.error('Failed to get stored session token:', error);
      return null;
    }
  }

  private async clearStoredSession(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('admin_session_token');
      } else {
        await AsyncStorage.removeItem('admin_session_token');
      }
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }

  private async getClientIP(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, we can't easily get the real IP from client side
        return null;
      }
      // For mobile, we'd need a service to get IP
      return null;
    } catch (error) {
      return null;
    }
  }

  private getUserAgent(): string {
    if (Platform.OS === 'web') {
      return navigator.userAgent;
    }
    return `React Native ${Platform.OS} ${Platform.Version}`;
  }
}

export default AdminAuthService.getInstance();
