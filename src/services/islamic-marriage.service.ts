import { supabase, db } from '../config/supabase';
import {
  Database,
  GenderType,
  MaritalStatusType,
  SectType,
  MadhabType,
  PolygamyPreferenceType,
  WifeNumberType,
  SeekingWifeNumberType,
  ProfileSearchFilters,
  CreateUserProfile,
  UpdateUserProfile,
  CreatePartnerPreferences,
  CreateIslamicQuestionnaire,
  UserWithProfile
} from '../types/database.types';

export class IslamicMarriageService {
  // Registration and Profile Management
  static async completeIslamicRegistration(
    authUserId: string,
    basicProfile: CreateUserProfile,
    islamicPreferences: CreatePartnerPreferences,
    questionnaire: CreateIslamicQuestionnaire
  ) {
    try {
      // Start a transaction-like process
      const { data: user, error: userError } = await db.users.create({
        auth_user_id: authUserId,
        email: basicProfile.first_name + '@example.com', // This should come from auth
        profile_status: 'active'
      });

      if (userError || !user) {
        throw new Error(`Failed to create user: ${userError?.message}`);
      }

      // Create user profile
      const { data: profile, error: profileError } = await db.profiles.create({
        ...basicProfile,
        user_id: user.id
      });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // Create partner preferences
      const { data: preferences, error: preferencesError } = await db.preferences.create({
        ...islamicPreferences,
        user_id: user.id
      });

      if (preferencesError) {
        throw new Error(`Failed to create preferences: ${preferencesError.message}`);
      }

      // Create Islamic questionnaire
      const { data: questData, error: questError } = await db.questionnaire.create({
        ...questionnaire,
        user_id: user.id
      });

      if (questError) {
        throw new Error(`Failed to create questionnaire: ${questError.message}`);
      }

      return {
        success: true,
        data: {
          user,
          profile,
          preferences,
          questionnaire: questData
        }
      };
    } catch (error) {
      console.error('Islamic registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  // Profile Search with Islamic filters
  static async searchIslamicProfiles(
    currentUserId: string,
    filters: ProfileSearchFilters,
    page = 0,
    limit = 20
  ) {
    try {
      // Get current user's gender to search for opposite gender
      const { data: currentProfile } = await db.profiles.getByUserId(currentUserId);
      if (!currentProfile) {
        throw new Error('Current user profile not found');
      }

      const searchGender: GenderType = currentProfile.gender === 'male' ? 'female' : 'male';

      // Build the search query
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          users!inner(*),
          partner_preferences(*),
          islamic_questionnaire(*),
          media_references(*)
        `)
        .eq('gender', searchGender)
        .eq('users.profile_status', 'active')
        .neq('user_id', currentUserId)
        .range(page * limit, (page + 1) * limit - 1);

      // Apply filters
      if (filters.minAge) query = query.gte('age', filters.minAge);
      if (filters.maxAge) query = query.lte('age', filters.maxAge);
      if (filters.country) query = query.eq('country', filters.country);
      if (filters.sect) query = query.eq('sect', filters.sect);
      if (filters.madhab) query = query.eq('madhab', filters.madhab);
      if (filters.maritalStatus) query = query.eq('marital_status', filters.maritalStatus);
      if (filters.hasChildren !== undefined) query = query.eq('has_children', filters.hasChildren);
      if (filters.hajjPerformed !== undefined) query = query.eq('hajj_performed', filters.hajjPerformed);
      if (filters.umrahPerformed !== undefined) query = query.eq('umrah_performed', filters.umrahPerformed);
      if (filters.minHeight) query = query.gte('height_cm', filters.minHeight);
      if (filters.maxHeight) query = query.lte('height_cm', filters.maxHeight);

      // Polygamy-specific filters
      if (filters.acceptPolygamy) {
        query = query.eq('accept_polygamy', filters.acceptPolygamy);
      }
      if (filters.seekingWifeNumber) {
        query = query.contains('seeking_wife_number', [filters.seekingWifeNumber]);
      }

      const { data: profiles, error } = await query;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return {
        success: true,
        data: profiles || [],
        pagination: {
          page,
          limit,
          hasMore: profiles && profiles.length === limit
        }
      };
    } catch (error) {
      console.error('Profile search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  // Polygamy-specific matching
  static async findPolygamyMatches(
    currentUserId: string,
    seekingWifeNumber: SeekingWifeNumberType,
    acceptPolygamy: PolygamyPreferenceType
  ) {
    try {
      const { data: currentProfile } = await db.profiles.getByUserId(currentUserId);
      if (!currentProfile) {
        throw new Error('Current user profile not found');
      }

      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          users!inner(*),
          partner_preferences(*),
          islamic_questionnaire(*)
        `)
        .eq('users.profile_status', 'active')
        .neq('user_id', currentUserId);

      if (currentProfile.gender === 'male') {
        // Male looking for potential wives
        query = query
          .eq('gender', 'female')
          .eq('accept_polygamy', acceptPolygamy)
          .contains('willing_wife_number', [seekingWifeNumber]);
      } else {
        // Female looking for potential husband who accepts polygamy
        query = query
          .eq('gender', 'male')
          .eq('seeking_wife_number', seekingWifeNumber)
          .gte('current_wives_count', 0)
          .lt('current_wives_count', 4); // Islamic limit
      }

      const { data: matches, error } = await query;

      if (error) {
        throw new Error(`Polygamy matching failed: ${error.message}`);
      }

      return {
        success: true,
        data: matches || []
      };
    } catch (error) {
      console.error('Polygamy matching error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Polygamy matching failed'
      };
    }
  }

  // Calculate Islamic compatibility score
  static calculateIslamicCompatibility(
    user1Profile: any,
    user2Profile: any,
    user1Preferences: any,
    user2Preferences: any,
    user1Questionnaire: any,
    user2Questionnaire: any
  ): number {
    let score = 0;
    const maxScore = 100;

    // Religious compatibility (40 points)
    if (user1Profile.sect === user2Profile.sect) score += 15;
    if (user1Profile.madhab === user2Profile.madhab) score += 10;
    if (user1Profile.prayer_frequency === user2Profile.prayer_frequency) score += 10;
    if (user1Profile.hajj_performed && user2Profile.hajj_performed) score += 5;

    // Age compatibility (15 points)
    const ageCompatible = 
      user1Profile.age >= (user2Preferences?.min_age || 18) &&
      user1Profile.age <= (user2Preferences?.max_age || 100) &&
      user2Profile.age >= (user1Preferences?.min_age || 18) &&
      user2Profile.age <= (user1Preferences?.max_age || 100);
    if (ageCompatible) score += 15;

    // Location compatibility (10 points)
    if (user1Profile.country === user2Profile.country) score += 8;
    if (user1Profile.state_province === user2Profile.state_province) score += 2;

    // Education compatibility (10 points)
    const educationLevels = [
      'no_formal_education', 'primary', 'secondary', 'high_school',
      'diploma', 'bachelor', 'master', 'doctorate', 'islamic_studies'
    ];
    const user1EduIndex = educationLevels.indexOf(user1Profile.education_level);
    const user2EduIndex = educationLevels.indexOf(user2Profile.education_level);
    const eduDifference = Math.abs(user1EduIndex - user2EduIndex);
    if (eduDifference <= 1) score += 10;
    else if (eduDifference <= 2) score += 5;

    // Marital status compatibility (10 points)
    const maritalCompatible = 
      (user2Preferences?.preferred_marital_status || []).includes(user1Profile.marital_status) &&
      (user1Preferences?.preferred_marital_status || []).includes(user2Profile.marital_status);
    if (maritalCompatible) score += 10;

    // Polygamy compatibility (15 points)
    if (user1Profile.gender === 'male' && user2Profile.gender === 'female') {
      // Male seeking female
      if (user1Profile.seeking_wife_number === 'first' && user2Profile.accept_polygamy !== 'no') {
        score += 15;
      } else if (
        user1Profile.seeking_wife_number !== 'first' && 
        user2Profile.accept_polygamy === 'accept' &&
        (user2Profile.willing_wife_number || []).includes(user1Profile.seeking_wife_number)
      ) {
        score += 15;
      }
    }

    // Islamic practice alignment from questionnaire (if available)
    if (user1Questionnaire && user2Questionnaire) {
      const prayerAlignment = Math.abs(
        (user1Questionnaire.daily_prayers_consistency || 0) - 
        (user2Questionnaire.daily_prayers_consistency || 0)
      );
      if (prayerAlignment <= 1) score += 5;
    }

    return Math.min(score, maxScore);
  }

  // Create or update match with Islamic compatibility
  static async createIslamicMatch(user1Id: string, user2Id: string) {
    try {
      // Get profiles and preferences
      const [
        { data: user1Profile },
        { data: user2Profile },
        { data: user1Preferences },
        { data: user2Preferences },
        { data: user1Questionnaire },
        { data: user2Questionnaire }
      ] = await Promise.all([
        db.profiles.getByUserId(user1Id),
        db.profiles.getByUserId(user2Id),
        db.preferences.getByUserId(user1Id),
        db.preferences.getByUserId(user2Id),
        db.questionnaire.getByUserId(user1Id),
        db.questionnaire.getByUserId(user2Id)
      ]);

      if (!user1Profile || !user2Profile) {
        throw new Error('One or both user profiles not found');
      }

      // Calculate compatibility score
      const compatibilityScore = this.calculateIslamicCompatibility(
        user1Profile,
        user2Profile,
        user1Preferences,
        user2Preferences,
        user1Questionnaire,
        user2Questionnaire
      );

      // Create the match
      const { data: match, error } = await db.matches.create({
        user1_id: user1Id,
        user2_id: user2Id,
        match_score: compatibilityScore,
        user1_status: 'pending',
        user2_status: 'pending'
      });

      if (error) {
        throw new Error(`Failed to create match: ${error.message}`);
      }

      return {
        success: true,
        data: {
          match,
          compatibilityScore
        }
      };
    } catch (error) {
      console.error('Create Islamic match error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create match'
      };
    }
  }

  // Get Islamic-specific profile recommendations
  static async getIslamicRecommendations(currentUserId: string, limit = 10) {
    try {
      const { data: currentProfile } = await db.profiles.getByUserId(currentUserId);
      const { data: currentPreferences } = await db.preferences.getByUserId(currentUserId);

      if (!currentProfile) {
        throw new Error('Current user profile not found');
      }

      // Search for compatible profiles
      const searchFilters: ProfileSearchFilters = {
        gender: currentProfile.gender === 'male' ? 'female' : 'male',
        minAge: currentPreferences?.min_age,
        maxAge: currentPreferences?.max_age,
        sect: currentProfile.sect,
        madhab: currentProfile.madhab,
        acceptPolygamy: currentProfile.accept_polygamy,
        seekingWifeNumber: currentProfile.seeking_wife_number
      };

      const { data: recommendations } = await this.searchIslamicProfiles(
        currentUserId,
        searchFilters,
        0,
        limit * 2 // Get more to filter and rank
      );

      if (!recommendations) {
        return { success: true, data: [] };
      }

      // Calculate compatibility scores and sort
      const scoredRecommendations = recommendations.map(profile => {
        const compatibilityScore = this.calculateIslamicCompatibility(
          currentProfile,
          profile,
          currentPreferences,
          profile.partner_preferences?.[0],
          null,
          profile.islamic_questionnaire?.[0]
        );

        return {
          ...profile,
          compatibilityScore
        };
      }).sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

      return {
        success: true,
        data: scoredRecommendations
      };
    } catch (error) {
      console.error('Get Islamic recommendations error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendations'
      };
    }
  }

  // Media management for external server
  static async addMediaReference(
    userId: string,
    externalUrl: string,
    mediaType: 'photo' | 'video',
    isProfilePicture = false,
    thumbnailUrl?: string
  ) {
    try {
      const { data: media, error } = await db.media.create({
        user_id: userId,
        media_type: mediaType,
        external_url: externalUrl,
        thumbnail_url: thumbnailUrl,
        is_profile_picture: isProfilePicture,
        visibility_level: 'private', // Default to private for Islamic modesty
        media_order: 1
      });

      if (error) {
        throw new Error(`Failed to add media reference: ${error.message}`);
      }

      return {
        success: true,
        data: media
      };
    } catch (error) {
      console.error('Add media reference error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add media'
      };
    }
  }

  // Get user's complete Islamic profile
  static async getCompleteIslamicProfile(userId: string): Promise<UserWithProfile | null> {
    try {
      const [
        { data: user },
        { data: profile },
        { data: preferences },
        { data: media },
        { data: questionnaire }
      ] = await Promise.all([
        db.users.getById(userId),
        db.profiles.getByUserId(userId),
        db.preferences.getByUserId(userId),
        db.media.getByUserId(userId),
        db.questionnaire.getByUserId(userId)
      ]);

      if (!user || !profile) {
        return null;
      }

      return {
        user,
        profile,
        preferences: preferences || undefined,
        media: media || [],
        questionnaire: questionnaire || undefined
      };
    } catch (error) {
      console.error('Get complete Islamic profile error:', error);
      return null;
    }
  }
}

export default IslamicMarriageService;
