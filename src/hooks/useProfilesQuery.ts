/**
 * Optimized React Query hooks for profile data
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { InterestsService } from '../services/interests';
import { QueryKeys } from '../config/queryClient';
import { images } from '../../constants';

export interface ProfileFilters {
  ageRange?: [number, number];
  selectedCountry?: string;
  selectedCity?: string;
  heightRange?: [number, number];
  weightRange?: [number, number];
  selectedEyeColor?: string[];
  selectedHairColor?: string[];
  selectedSkinTone?: string[];
  selectedBodyType?: string[];
  selectedEducation?: string[];
  selectedLanguages?: string[];
  selectedHousingType?: string[];
  selectedLivingCondition?: string[];
  selectedSocialCondition?: string[];
  selectedWorkStatus?: string[];
  selectedReligiousLevel?: string[];
  selectedPrayerFrequency?: string[];
  selectedQuranReading?: string[];
  selectedCoveringLevel?: string[];
  selectedBeardPractice?: string[];
  selectedAcceptedWifePositions?: string[];
  selectedSeekingWifeNumber?: string[];
}

export interface ProfileItem {
  id: string;
  user_id: string;
  name: string;
  age: number;
  height?: string;
  weight?: string;
  country?: string;
  city?: string;
  image: any;
  unlocked?: boolean;
}

const PAGE_SIZE = 12;

// Fetch profiles with optimized query
async function fetchProfiles(
  pageParam: number = 0,
  filters: ProfileFilters = {}
): Promise<{
  profiles: ProfileItem[];
  nextPage?: number;
  hasMore: boolean;
}> {
  try {
    // Get current user info
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    let currentUserGender = null;
    
    if (currentUser?.id) {
      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('gender')
        .eq('user_id', currentUser.id)
        .single();
      currentUserGender = currentUserProfile?.gender;
    }

    const start = pageParam * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    // Build optimized query
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        first_name,
        date_of_birth,
        height_cm,
        weight_kg,
        city,
        country,
        gender,
        profile_picture_url,
        islamic_questionnaire
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(start, end);

    // Apply filters
    if (currentUser?.id) {
      query = query.neq('user_id', currentUser.id);
    }
    
    if (currentUserGender) {
      const oppositeGender = currentUserGender.toLowerCase() === 'male' ? 'female' : 'male';
      query = query.eq('gender', oppositeGender);
    }

    // Apply location filters
    if (filters.selectedCountry) {
      query = query.eq('country', filters.selectedCountry);
    }
    if (filters.selectedCity) {
      query = query.eq('city', filters.selectedCity);
    }

    // Apply physical filters
    const isDefaultHeight = !filters.heightRange || (filters.heightRange[0] === 150 && filters.heightRange[1] === 200);
    const isDefaultWeight = !filters.weightRange || (filters.weightRange[0] === 40 && filters.weightRange[1] === 120);
    
    if (filters.heightRange && !isDefaultHeight) {
      query = query.gte('height_cm', filters.heightRange[0]).lte('height_cm', filters.heightRange[1]);
    }
    if (filters.weightRange && !isDefaultWeight) {
      query = query.gte('weight_kg', filters.weightRange[0]).lte('weight_kg', filters.weightRange[1]);
    }
    if (filters.selectedEyeColor?.length) {
      query = query.in('eye_color', filters.selectedEyeColor);
    }
    if (filters.selectedHairColor?.length) {
      query = query.in('hair_color', filters.selectedHairColor);
    }

    const { data: profilesData, error } = await query;

    if (error) throw error;
    if (!profilesData) return { profiles: [], hasMore: false };

    // Get interests in batch (optimized)
    const interests = await InterestsService.loadAllInterestsForUser();

    // Process profiles efficiently
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentDate = new Date().getDate();

    const processedProfiles = profilesData.map((profile: any) => {
      // Optimized age calculation
      const birthDate = new Date(profile.date_of_birth);
      const age = currentYear - birthDate.getFullYear() - 
                 ((currentMonth < birthDate.getMonth() || 
                  (currentMonth === birthDate.getMonth() && currentDate < birthDate.getDate())) ? 1 : 0);

      // Apply age filter
      const isDefaultAge = !filters.ageRange || (filters.ageRange[0] === 20 && filters.ageRange[1] === 50);
      if (!isDefaultAge && (age < filters.ageRange![0] || age > filters.ageRange![1])) {
        return null;
      }

      const isFemale = profile.gender?.toLowerCase() === 'female';

      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.first_name || 'Member',
        age,
        height: profile.height_cm ? `${profile.height_cm}cm` : undefined,
        weight: profile.weight_kg ? `${profile.weight_kg}kg` : undefined,
        country: profile.country || undefined,
        city: profile.city || undefined,
        image: profile.profile_picture_url ? 
          { uri: profile.profile_picture_url } : 
          (isFemale ? images.femaleSilhouette : images.maleSilhouette),
        unlocked: interests.approved.has(profile.user_id) || interests.pendingIncoming.has(profile.user_id)
      };
    }).filter(Boolean) as ProfileItem[];

    return {
      profiles: processedProfiles,
      nextPage: processedProfiles.length === PAGE_SIZE ? pageParam + 1 : undefined,
      hasMore: processedProfiles.length === PAGE_SIZE
    };
  } catch (error) {
    console.error('Failed to fetch profiles:', error);
    throw error;
  }
}

// Hook for infinite scroll profiles
export function useProfilesInfinite(filters: ProfileFilters = {}) {
  return useInfiniteQuery({
    queryKey: QueryKeys.profilesInfinite(filters),
    queryFn: ({ pageParam = 0 }) => fetchProfiles(pageParam, filters),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for interests data
export function useInterests() {
  return useQuery({
    queryKey: QueryKeys.interests,
    queryFn: InterestsService.loadAllInterestsForUser,
    staleTime: 5 * 60 * 1000, // 5 minutes for interests
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
