/**
 * Optimized Profiles Service - Uses materialized view for maximum performance
 */

import { supabase } from '../config/supabase';
import { images } from '../../constants';

export interface OptimizedProfileFilters {
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
  searchQuery?: string;
}

export interface OptimizedProfile {
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

export class OptimizedProfilesService {
  private static readonly PAGE_SIZE = 12;

  /**
   * Fetch profiles using the optimized materialized view
   */
  static async fetchOptimizedProfiles(
    page: number = 0,
    filters: OptimizedProfileFilters = {},
    currentUserGender?: string | null
  ): Promise<{
    profiles: OptimizedProfile[];
    hasMore: boolean;
    total?: number;
  }> {
    try {
      const start = page * this.PAGE_SIZE;
      const end = start + this.PAGE_SIZE - 1;

      // Build query using optimized materialized view
      let query = supabase
        .from('optimized_home_profiles')
        .select('*', { count: 'exact' })
        .range(start, end)
        .order('created_at', { ascending: false });

      // Apply gender filter (show opposite gender)
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

      // Apply age filters using pre-computed age
      if (filters.ageRange && filters.ageRange[0] > 0 && filters.ageRange[1] > 0) {
        const [minAge, maxAge] = filters.ageRange;
        if (minAge !== 20 || maxAge !== 50) { // Only apply if not default
          query = query.gte('age', minAge).lte('age', maxAge);
        }
      }

      // Apply physical filters
      if (filters.heightRange && filters.heightRange[0] !== 150 && filters.heightRange[1] !== 200) {
        query = query.gte('height_cm', filters.heightRange[0]).lte('height_cm', filters.heightRange[1]);
      }
      if (filters.weightRange && filters.weightRange[0] !== 40 && filters.weightRange[1] !== 120) {
        query = query.gte('weight_kg', filters.weightRange[0]).lte('weight_kg', filters.weightRange[1]);
      }

      // Apply appearance filters
      if (filters.selectedEyeColor?.length) {
        query = query.in('eye_color', filters.selectedEyeColor);
      }
      if (filters.selectedHairColor?.length) {
        query = query.in('hair_color', filters.selectedHairColor);
      }
      if (filters.selectedSkinTone?.length) {
        query = query.in('skin_tone', filters.selectedSkinTone);
      }
      if (filters.selectedBodyType?.length) {
        query = query.in('body_type', filters.selectedBodyType);
      }

      // Apply lifestyle filters
      if (filters.selectedEducation?.length) {
        query = query.in('education_level', filters.selectedEducation);
      }
      if (filters.selectedHousingType?.length) {
        query = query.in('housing_type', filters.selectedHousingType);
      }
      if (filters.selectedLivingCondition?.length) {
        query = query.in('living_condition', filters.selectedLivingCondition);
      }
      if (filters.selectedSocialCondition?.length) {
        query = query.in('social_condition', filters.selectedSocialCondition);
      }
      if (filters.selectedWorkStatus?.length) {
        query = query.in('work_status', filters.selectedWorkStatus);
      }

      // Apply language filter
      if (filters.selectedLanguages?.length) {
        query = query.contains('languages_spoken', filters.selectedLanguages);
      }

      // Apply search query using full-text search
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const searchTerm = filters.searchQuery.trim().replace(/\s+/g, ' & ');
        query = query.textSearch('search_vector', searchTerm);
      }

      // Execute the query
      const { data: profilesData, error, count } = await query;

      if (error) {
        console.error('Optimized profiles query error:', error);
        throw error;
      }

      if (!profilesData) {
        return { profiles: [], hasMore: false, total: 0 };
      }

      // Process profiles efficiently (minimal processing since view is pre-optimized)
      const processedProfiles: OptimizedProfile[] = profilesData.map((profile: any) => {
        const isFemale = profile.is_female === 1;

        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.first_name || 'Member',
          age: profile.age, // Pre-computed in view
          height: profile.height_cm ? `${profile.height_cm}cm` : undefined,
          weight: profile.weight_kg ? `${profile.weight_kg}kg` : undefined,
          country: profile.country || undefined,
          city: profile.city || undefined,
          image: profile.optimized_image_url ? 
            { uri: profile.optimized_image_url } : 
            (isFemale ? images.femaleSilhouette : images.maleSilhouette),
          unlocked: false // Will be set by interest service
        };
      });

      return {
        profiles: processedProfiles,
        hasMore: profilesData.length === this.PAGE_SIZE,
        total: count || 0
      };

    } catch (error) {
      console.error('Failed to fetch optimized profiles:', error);
      throw error;
    }
  }

  /**
   * Get profile counts by filters for analytics
   */
  static async getProfileCounts(
    filters: OptimizedProfileFilters = {},
    currentUserGender?: string | null
  ): Promise<{
    total: number;
    byAgeRange: Record<string, number>;
    byLocation: Record<string, number>;
  }> {
    try {
      // Base query for counts
      let baseQuery = supabase
        .from('optimized_home_profiles')
        .select('age_range, country', { count: 'exact' });

      // Apply gender filter
      if (currentUserGender) {
        const oppositeGender = currentUserGender.toLowerCase() === 'male' ? 'female' : 'male';
        baseQuery = baseQuery.eq('gender', oppositeGender);
      }

      // Apply basic filters
      if (filters.selectedCountry) {
        baseQuery = baseQuery.eq('country', filters.selectedCountry);
      }

      const { data, error, count } = await baseQuery;

      if (error) throw error;

      // Process counts
      const byAgeRange: Record<string, number> = {};
      const byLocation: Record<string, number> = {};

      data?.forEach((item: any) => {
        if (item.age_range) {
          byAgeRange[item.age_range] = (byAgeRange[item.age_range] || 0) + 1;
        }
        if (item.country) {
          byLocation[item.country] = (byLocation[item.country] || 0) + 1;
        }
      });

      return {
        total: count || 0,
        byAgeRange,
        byLocation
      };

    } catch (error) {
      console.error('Failed to get profile counts:', error);
      return { total: 0, byAgeRange: {}, byLocation: {} };
    }
  }

  /**
   * Refresh the materialized view (call periodically or on demand)
   */
  static async refreshMaterializedView(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_optimized_home_profiles');
      if (error) {
        console.error('Failed to refresh materialized view:', error);
      }
    } catch (error) {
      console.error('Error refreshing materialized view:', error);
    }
  }

  /**
   * Check if materialized view exists and is up to date
   */
  static async checkViewStatus(): Promise<{
    exists: boolean;
    lastRefresh?: Date;
    rowCount?: number;
  }> {
    try {
      // Check if view exists and get basic stats
      const { data, error } = await supabase
        .from('optimized_home_profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { exists: false };
      }

      return {
        exists: true,
        rowCount: data?.length || 0
      };

    } catch (error) {
      return { exists: false };
    }
  }
}
