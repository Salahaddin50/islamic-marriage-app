import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import IslamicMarriageService from '../services/islamic-marriage.service';
import RegistrationService, { RegistrationData, PreferencesData, QuestionnaireData } from '../services/registration.service';
import MediaService from '../services/media.service';
import { supabase } from '../config/supabase';
import { ProfileSearchFilters, UserWithProfile } from '../types/database.types';

// Query Keys
export const queryKeys = {
  user: ['user'],
  userProfile: (userId: string) => ['userProfile', userId],
  matches: (userId: string) => ['matches', userId],
  recommendations: (userId: string) => ['recommendations', userId],
  media: (userId: string) => ['media', userId],
  profileSearch: (filters: ProfileSearchFilters) => ['profileSearch', filters],
  polygamyMatches: (userId: string) => ['polygamyMatches', userId],
} as const;

// ==========================================
// AUTHENTICATION HOOKS
// ==========================================

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationData,
      preferencesData,
      questionnaireData
    }: {
      registrationData: RegistrationData;
      preferencesData: PreferencesData;
      questionnaireData: QuestionnaireData;
    }) => {
      const result = await RegistrationService.registerIslamicMarriageUser(
        registrationData,
        preferencesData,
        questionnaireData
      );

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate user queries on successful registration
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await RegistrationService.signInUser(email, password);

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate user queries on successful login
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

// ==========================================
// USER PROFILE HOOKS
// ==========================================

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: async (): Promise<UserWithProfile | null> => {
      return await IslamicMarriageService.getCompleteIslamicProfile(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, { userId }) => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, preferences }: { userId: string; preferences: PreferencesData }) => {
      const { data, error } = await supabase
        .from('partner_preferences')
        .upsert({ user_id: userId, ...preferences })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    },
  });
};

// ==========================================
// MATCHING HOOKS
// ==========================================

export const useMatches = (userId: string, mutualOnly: boolean = false) => {
  return useQuery({
    queryKey: queryKeys.matches(userId),
    queryFn: async () => {
      const result = await IslamicMarriageService.getUserMatches(userId, mutualOnly);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch matches');
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRecommendations = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.recommendations(userId),
    queryFn: async () => {
      const result = await IslamicMarriageService.getIslamicRecommendations(userId, limit);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProfileSearch = (userId: string, filters: ProfileSearchFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.profileSearch(filters),
    queryFn: async () => {
      const result = await IslamicMarriageService.searchIslamicProfiles(userId, filters);
      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }
      return result.data;
    },
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const usePolygamyMatches = (
  userId: string,
  seekingWifeNumber: any,
  acceptPolygamy: any,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.polygamyMatches(userId),
    queryFn: async () => {
      const result = await IslamicMarriageService.findPolygamyMatches(
        userId,
        seekingWifeNumber,
        acceptPolygamy
      );
      if (!result.success) {
        throw new Error(result.error || 'Polygamy matching failed');
      }
      return result.data;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user1Id, user2Id }: { user1Id: string; user2Id: string }) => {
      const result = await IslamicMarriageService.createIslamicMatch(user1Id, user2Id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create match');
      }
      return result.data;
    },
    onSuccess: (_, { user1Id, user2Id }) => {
      // Invalidate matches for both users
      queryClient.invalidateQueries({ queryKey: queryKeys.matches(user1Id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches(user2Id) });
    },
  });
};

export const useUpdateMatchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      matchId, 
      userId, 
      status 
    }: { 
      matchId: string; 
      userId: string; 
      status: string 
    }) => {
      const { data, error } = await supabase
        .from('user_matches')
        .update({
          [userId.endsWith('1') ? 'user1_status' : 'user2_status']: status,
          is_mutual_match: status === 'liked' ? true : false
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches(userId) });
    },
  });
};

// ==========================================
// MEDIA HOOKS
// ==========================================

export const useUserMedia = (userId: string, viewerUserId?: string) => {
  return useQuery({
    queryKey: queryKeys.media(userId),
    queryFn: async () => {
      const result = await MediaService.getUserMedia(userId, viewerUserId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch media');
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      userId,
      mediaType,
      isProfilePicture,
      visibility
    }: {
      file: File | Blob;
      userId: string;
      mediaType: 'photo' | 'video';
      isProfilePicture?: boolean;
      visibility?: 'public' | 'private' | 'matched_only';
    }) => {
      const result = await MediaService.uploadMedia(file, {
        userId,
        mediaType,
        isProfilePicture,
        visibility
      });

      if (!result.success) {
        throw new Error(result.error || 'Media upload failed');
      }

      return result.data;
    },
    onSuccess: (_, { userId }) => {
      // Invalidate media queries
      queryClient.invalidateQueries({ queryKey: queryKeys.media(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, userId }: { mediaId: string; userId: string }) => {
      const result = await MediaService.deleteMedia(mediaId, userId);
      if (!result.success) {
        throw new Error(result.error || 'Media deletion failed');
      }
      return result.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    },
  });
};

export const useUpdateMediaVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      userId,
      visibility
    }: {
      mediaId: string;
      userId: string;
      visibility: 'public' | 'private' | 'matched_only';
    }) => {
      const result = await MediaService.updateMediaVisibility(mediaId, userId, visibility);
      if (!result.success) {
        throw new Error(result.error || 'Visibility update failed');
      }
      return result.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media(userId) });
    },
  });
};

export const useSetProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, userId }: { mediaId: string; userId: string }) => {
      const result = await MediaService.setProfilePicture(mediaId, userId);
      if (!result.success) {
        throw new Error(result.error || 'Profile picture update failed');
      }
      return result.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    },
  });
};

// ==========================================
// REALTIME HOOKS
// ==========================================

export const useMatchesSubscription = (userId: string, onNewMatch: (match: any) => void) => {
  return useQuery({
    queryKey: ['matchesSubscription', userId],
    queryFn: () => null,
    enabled: false,
    onMount: () => {
      const subscription = supabase
        .channel('matches')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_matches',
            filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
          },
          onNewMatch
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    },
  });
};

// ==========================================
// UTILITY HOOKS
// ==========================================

export const useCompatibilityScore = (user1Id: string, user2Id: string) => {
  return useQuery({
    queryKey: ['compatibilityScore', user1Id, user2Id],
        queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_match_score', {
          user1_uuid: user1Id,
          user2_uuid: user2Id
        });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user1Id && !!user2Id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUserActivity = () => {
  return useMutation({
    mutationFn: async ({
      userId,
      activityType,
      activityData
    }: {
      userId: string;
      activityType: string;
      activityData?: any;
    }) => {
      try {
        const { data, error } = await supabase
          .from('user_activity')
          .insert({
            user_id: userId,
            activity_type: activityType,
            activity_data: activityData,
            created_at: new Date().toISOString()
          });

        if (error) throw new Error(error.message);
        return data;
      } catch (err) {
        // Silently ignore RLS/permission errors to avoid breaking UX
        console.warn('user_activity log skipped:', (err as any)?.message || err);
        return null as any;
      }
    },
  });
};

// ==========================================
// EXPORTED HOOKS
// ==========================================

export {
  // Auth
  useRegister,
  useLogin,
  
  // Profile
  useUserProfile,
  useUpdateProfile,
  useUpdatePreferences,
  
  // Matching
  useMatches,
  useRecommendations,
  useProfileSearch,
  usePolygamyMatches,
  useCreateMatch,
  useUpdateMatchStatus,
  
  // Media
  useUserMedia,
  useUploadMedia,
  useDeleteMedia,
  useUpdateMediaVisibility,
  useSetProfilePicture,
  
  // Realtime
  useMatchesSubscription,
  
  // Utility
  useCompatibilityScore,
  useUserActivity,
};