import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rpzkugodaacelruquhtc.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwemt1Z29kYWFjZWxydXF1aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTIwNTQsImV4cCI6MjA3MDg2ODA1NH0.NEPLSSs8JG4LK-RwJWI3GIg9hwzQLMXyllVF3Fv3yCE';

// For build environments, use defaults if environment variables are not available
if (!supabaseAnonKey && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.warn('Missing Supabase configuration. Using defaults for development.');
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure auth options
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  },
  realtime: {
    // Configure realtime options for chat functionality
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with OTP (for phone verification)
  signInWithOtp: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  },

  // Verify OTP
  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // Update user password
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const db = {
  // User operations
  users: {
    // Create user profile after auth signup
    create: async (userData: any) => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      return { data, error };
    },

    // Get user by ID
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    // Update user
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },
  },

  // User profiles operations
  profiles: {
    // Create profile
    create: async (profileData: any) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();
      return { data, error };
    },

    // Get profile by user ID
    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      return { data, error };
    },

    // Update profile
    update: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      return { data, error };
    },

    // Search profiles with filters
    search: async (filters: any, limit = 20, offset = 0) => {
      let query = supabase
        .from('user_profiles')
        .select('*')
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters.minAge) {
        query = query.gte('age', filters.minAge);
      }
      if (filters.maxAge) {
        query = query.lte('age', filters.maxAge);
      }
      if (filters.country) {
        query = query.eq('country', filters.country);
      }
      if (filters.sect) {
        query = query.eq('sect', filters.sect);
      }
      if (filters.maritalStatus) {
        query = query.eq('marital_status', filters.maritalStatus);
      }

      const { data, error } = await query;
      return { data, error };
    },
  },

  // Partner preferences operations
  preferences: {
    // Create preferences
    create: async (preferencesData: any) => {
      const { data, error } = await supabase
        .from('partner_preferences')
        .insert(preferencesData)
        .select()
        .single();
      return { data, error };
    },

    // Get preferences by user ID
    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      return { data, error };
    },

    // Update preferences
    update: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('partner_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Media references operations
  media: {
    // Add media reference
    create: async (mediaData: any) => {
      const { data, error } = await supabase
        .from('media_references')
        .insert(mediaData)
        .select()
        .single();
      return { data, error };
    },

    // Get user media
    getByUserId: async (userId: string, mediaType?: string) => {
      let query = supabase
        .from('media_references')
        .select('*')
        .eq('user_id', userId)
        .order('media_order');

      if (mediaType) {
        query = query.eq('media_type', mediaType);
      }

      const { data, error } = await query;
      return { data, error };
    },

    // Update media
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('media_references')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    // Delete media
    delete: async (id: string) => {
      const { data, error } = await supabase
        .from('media_references')
        .delete()
        .eq('id', id);
      return { data, error };
    },
  },

  // Matching operations
  matches: {
    // Create a match
    create: async (matchData: any) => {
      const { data, error } = await supabase
        .from('user_matches')
        .insert(matchData)
        .select()
        .single();
      return { data, error };
    },

    // Get user matches
    getByUserId: async (userId: string, mutualOnly = false) => {
      let query = supabase
        .from('user_matches')
        .select(`
          *,
          user1:user_profiles!user_matches_user1_id_fkey(*),
          user2:user_profiles!user_matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (mutualOnly) {
        query = query.eq('is_mutual_match', true);
      }

      const { data, error } = await query;
      return { data, error };
    },

    // Update match status
    updateStatus: async (matchId: string, userId: string, status: string) => {
      // Determine which user status to update
      const { data: match } = await supabase
        .from('user_matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (!match) return { data: null, error: new Error('Match not found') };

      const statusField = match.user1_id === userId ? 'user1_status' : 'user2_status';
      
      const { data, error } = await supabase
        .from('user_matches')
        .update({ [statusField]: status })
        .eq('id', matchId)
        .select()
        .single();

      return { data, error };
    },
  },

  // Islamic questionnaire operations
  questionnaire: {
    // Create questionnaire response
    create: async (questionnaireData: any) => {
      const { data, error } = await supabase
        .from('islamic_questionnaire')
        .insert(questionnaireData)
        .select()
        .single();
      return { data, error };
    },

    // Get questionnaire by user ID
    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('islamic_questionnaire')
        .select('*')
        .eq('user_id', userId)
        .single();
      return { data, error };
    },

    // Update questionnaire
    update: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('islamic_questionnaire')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      return { data, error };
    },
  },
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to new matches
  subscribeToMatches: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_matches',
          filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to profile updates
  subscribeToProfileUpdates: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel('profile_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};

export default supabase;
