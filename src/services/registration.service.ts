import { supabase, auth, db } from '../config/supabase';
import IslamicMarriageService from './islamic-marriage.service';
import {
  CreateUserProfile,
  CreatePartnerPreferences,
  CreateIslamicQuestionnaire,
  GenderType,
  MaritalStatusType,
  SectType,
  MadhabType,
  PolygamyPreferenceType,
  WifeNumberType,
  SeekingWifeNumberType
} from '../types/database.types';

export interface RegistrationData {
  // Authentication
  email: string;
  password: string;
  phone?: string;

  // Basic Profile
  firstName: string;
  lastName: string;
  gender: GenderType;
  dateOfBirth: string;
  
  // Physical characteristics
  heightCm?: number;
  weightKg?: number;
  eyeColor?: string;
  hairColor?: string;
  skinTone?: string;
  bodyType?: string;

  // Location
  country: string;
  stateProvince?: string;
  city: string;
  postalCode?: string;
  willingToRelocate: boolean;

  // Islamic Information
  sect: SectType;
  madhab?: MadhabType;
  prayerFrequency: string;
  quranMemorizationLevel?: string;
  islamicEducationLevel?: string;
  hajjPerformed: boolean;
  umrahPerformed: boolean;
  hijabStyle?: string;
  beardStyle?: string;

  // Marriage Information
  maritalStatus: MaritalStatusType;
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenLivingWithUser: boolean;
  wantsChildren?: boolean;

  // Polygamy preferences
  acceptPolygamy?: PolygamyPreferenceType;
  willingWifeNumber?: WifeNumberType[];
  seekingWifeNumber?: SeekingWifeNumberType;
  currentWivesCount?: number;

  // Education & Career
  educationLevel?: string;
  fieldOfStudy?: string;
  occupation?: string;
  occupationCategory?: string;
  annualIncomeRange?: string;
  employmentStatus?: string;

  // Family background
  fatherOccupation?: string;
  motherOccupation?: string;
  numberOfSiblings?: number;
  familyReligiousLevel?: string;
  familyFinancialStatus?: string;

  // Personal
  bio?: string;
  hobbies?: string[];
  languagesSpoken?: string[];
  lookingFor?: string;
}

export interface PreferencesData {
  // Age preferences
  minAge: number;
  maxAge: number;

  // Physical preferences
  minHeightCm?: number;
  maxHeightCm?: number;
  preferredEyeColors?: string[];
  preferredHairColors?: string[];
  preferredSkinTones?: string[];
  preferredBodyTypes?: string[];

  // Location preferences
  preferredCountries?: string[];
  preferredStates?: string[];
  maxDistanceKm?: number;
  acceptInternational: boolean;

  // Islamic preferences
  preferredSects?: SectType[];
  preferredMadhabs?: MadhabType[];
  minPrayerFrequency?: string;
  preferHafiz: boolean;
  preferIslamicEducation: boolean;
  preferHajjPerformed: boolean;
  preferredHijabStyles?: string[];
  preferredBeardStyles?: string[];

  // Marriage preferences
  preferredMaritalStatus: MaritalStatusType[];
  acceptDivorced: boolean;
  acceptWidowed: boolean;
  acceptWithChildren: boolean;
  wantChildrenTogether?: boolean;

  // Polygamy preferences
  acceptPolygamousMarriage: PolygamyPreferenceType;
  preferredWifePositions?: SeekingWifeNumberType[];

  // Education & Career
  minEducationLevel?: string;
  preferredOccupations?: string[];
  minIncomeExpectation?: string;

  // Other
  preferredLanguages?: string[];
  dealBreakers?: string[];
  importantQualities?: string[];
}

export interface QuestionnaireData {
  // Religious practice
  dailyPrayersConsistency?: number;
  fridayPrayersAttendance?: string;
  quranReadingFrequency?: string;
  islamicKnowledgeLevel?: string;
  religiousEventsParticipation?: string;

  // Family and marriage views
  genderRolesView?: string;
  familyPlanningView?: string;
  religiousEducationChildren?: string;
  spouseReligiousExpectations?: string;

  // Lifestyle
  halalFoodStrictness?: string;
  musicEntertainmentView?: string;
  socialMediaUsage?: string;
  modestyInterpretation?: string;

  // Polygamy specific
  polygamyUnderstanding?: string;
  polygamyComfortLevel?: number;
  coWifeRelationshipExpectations?: string;
  multipleWivesManagementPlan?: string;
  financialResponsibilityView?: string;
  timeSharingExpectations?: string;
}

export class RegistrationService {
  /**
   * Complete Islamic marriage registration process
   */
  static async registerIslamicMarriageUser(
    registrationData: RegistrationData,
    preferencesData: PreferencesData,
    questionnaireData: QuestionnaireData
  ) {
    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await auth.signUp(
        registrationData.email,
        registrationData.password,
        {
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          phone: registrationData.phone
        }
      );

      if (authError || !authData.user) {
        return {
          success: false,
          error: `Authentication failed: ${authError?.message || 'Unknown error'}`
        };
      }

      // Step 2: Create user record
      const userData = {
        auth_user_id: authData.user.id,
        email: registrationData.email,
        phone: registrationData.phone,
        profile_status: 'active' as const
      };

      const { data: user, error: userError } = await db.users.create(userData);

      if (userError || !user) {
        return {
          success: false,
          error: `User creation failed: ${userError?.message || 'Unknown error'}`
        };
      }

      // Step 3: Create user profile
      const profileData: CreateUserProfile = {
        user_id: user.id,
        first_name: registrationData.firstName,
        last_name: registrationData.lastName,
        gender: registrationData.gender,
        date_of_birth: registrationData.dateOfBirth,
        height_cm: registrationData.heightCm,
        weight_kg: registrationData.weightKg,
        eye_color: registrationData.eyeColor as any,
        hair_color: registrationData.hairColor as any,
        skin_tone: registrationData.skinTone as any,
        body_type: registrationData.bodyType as any,
        country: registrationData.country,
        state_province: registrationData.stateProvince,
        city: registrationData.city,
        postal_code: registrationData.postalCode,
        willing_to_relocate: registrationData.willingToRelocate,
        sect: registrationData.sect,
        madhab: registrationData.madhab,
        prayer_frequency: registrationData.prayerFrequency as any,
        quran_memorization_level: registrationData.quranMemorizationLevel,
        islamic_education_level: registrationData.islamicEducationLevel,
        hajj_performed: registrationData.hajjPerformed,
        umrah_performed: registrationData.umrahPerformed,
        hijab_style: registrationData.hijabStyle as any,
        beard_style: registrationData.beardStyle as any,
        marital_status: registrationData.maritalStatus,
        has_children: registrationData.hasChildren,
        number_of_children: registrationData.numberOfChildren || 0,
        children_living_with_user: registrationData.childrenLivingWithUser,
        wants_children: registrationData.wantsChildren,
        accept_polygamy: registrationData.acceptPolygamy,
        willing_wife_number: registrationData.willingWifeNumber,
        seeking_wife_number: registrationData.seekingWifeNumber,
        current_wives_count: registrationData.currentWivesCount || 0,
        education_level: registrationData.educationLevel as any,
        field_of_study: registrationData.fieldOfStudy,
        occupation: registrationData.occupation,
        occupation_category: registrationData.occupationCategory as any,
        annual_income_range: registrationData.annualIncomeRange,
        employment_status: registrationData.employmentStatus,
        father_occupation: registrationData.fatherOccupation,
        mother_occupation: registrationData.motherOccupation,
        number_of_siblings: registrationData.numberOfSiblings,
        family_religious_level: registrationData.familyReligiousLevel,
        family_financial_status: registrationData.familyFinancialStatus,
        bio: registrationData.bio,
        hobbies: registrationData.hobbies,
        languages_spoken: registrationData.languagesSpoken,
        looking_for: registrationData.lookingFor
      };

      const { data: profile, error: profileError } = await db.profiles.create(profileData);

      if (profileError) {
        return {
          success: false,
          error: `Profile creation failed: ${profileError.message}`
        };
      }

      // Step 4: Create partner preferences
      const preferences: CreatePartnerPreferences = {
        user_id: user.id,
        min_age: preferencesData.minAge,
        max_age: preferencesData.maxAge,
        min_height_cm: preferencesData.minHeightCm,
        max_height_cm: preferencesData.maxHeightCm,
        preferred_eye_colors: preferencesData.preferredEyeColors as any,
        preferred_hair_colors: preferencesData.preferredHairColors as any,
        preferred_skin_tones: preferencesData.preferredSkinTones as any,
        preferred_body_types: preferencesData.preferredBodyTypes as any,
        preferred_countries: preferencesData.preferredCountries,
        preferred_states: preferencesData.preferredStates,
        max_distance_km: preferencesData.maxDistanceKm,
        accept_international: preferencesData.acceptInternational,
        preferred_sects: preferencesData.preferredSects,
        preferred_madhabs: preferencesData.preferredMadhabs,
        min_prayer_frequency: preferencesData.minPrayerFrequency as any,
        prefer_hafiz: preferencesData.preferHafiz,
        prefer_islamic_education: preferencesData.preferIslamicEducation,
        prefer_hajj_performed: preferencesData.preferHajjPerformed,
        preferred_hijab_styles: preferencesData.preferredHijabStyles as any,
        preferred_beard_styles: preferencesData.preferredBeardStyles as any,
        preferred_marital_status: preferencesData.preferredMaritalStatus,
        accept_divorced: preferencesData.acceptDivorced,
        accept_widowed: preferencesData.acceptWidowed,
        accept_with_children: preferencesData.acceptWithChildren,
        want_children_together: preferencesData.wantChildrenTogether,
        accept_polygamous_marriage: preferencesData.acceptPolygamousMarriage,
        preferred_wife_positions: preferencesData.preferredWifePositions,
        min_education_level: preferencesData.minEducationLevel as any,
        preferred_occupations: preferencesData.preferredOccupations,
        min_income_expectation: preferencesData.minIncomeExpectation,
        preferred_languages: preferencesData.preferredLanguages,
        deal_breakers: preferencesData.dealBreakers,
        important_qualities: preferencesData.importantQualities
      };

      const { data: preferencesResult, error: preferencesError } = await db.preferences.create(preferences);

      if (preferencesError) {
        return {
          success: false,
          error: `Preferences creation failed: ${preferencesError.message}`
        };
      }

      // Step 5: Create Islamic questionnaire
      const questionnaire: CreateIslamicQuestionnaire = {
        user_id: user.id,
        daily_prayers_consistency: questionnaireData.dailyPrayersConsistency,
        friday_prayers_attendance: questionnaireData.fridayPrayersAttendance,
        quran_reading_frequency: questionnaireData.quranReadingFrequency,
        islamic_knowledge_level: questionnaireData.islamicKnowledgeLevel,
        religious_events_participation: questionnaireData.religiousEventsParticipation,
        gender_roles_view: questionnaireData.genderRolesView,
        family_planning_view: questionnaireData.familyPlanningView,
        religious_education_children: questionnaireData.religiousEducationChildren,
        spouse_religious_expectations: questionnaireData.spouseReligiousExpectations,
        halal_food_strictness: questionnaireData.halalFoodStrictness,
        music_entertainment_view: questionnaireData.musicEntertainmentView,
        social_media_usage: questionnaireData.socialMediaUsage,
        modesty_interpretation: questionnaireData.modestyInterpretation,
        polygamy_understanding: questionnaireData.polygamyUnderstanding,
        polygamy_comfort_level: questionnaireData.polygamyComfortLevel,
        co_wife_relationship_expectations: questionnaireData.coWifeRelationshipExpectations,
        multiple_wives_management_plan: questionnaireData.multipleWivesManagementPlan,
        financial_responsibility_view: questionnaireData.financialResponsibilityView,
        time_sharing_expectations: questionnaireData.timeSharingExpectations
      };

      const { data: questionnaireResult, error: questionnaireError } = await db.questionnaire.create(questionnaire);

      if (questionnaireError) {
        return {
          success: false,
          error: `Questionnaire creation failed: ${questionnaireError.message}`
        };
      }

      // Step 6: Log activity (disabled to avoid 403 under RLS)
      // Intentionally skipped on client to avoid RLS/network errors

      return {
        success: true,
        data: {
          user,
          profile,
          preferences: preferencesResult,
          questionnaire: questionnaireResult,
          authUser: authData.user
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed unexpectedly'
      };
    }
  }

  /**
   * Sign in existing user
   */
  static async signInUser(email: string, password: string) {
    try {
      const { data: authData, error: authError } = await auth.signIn(email, password);

      if (authError || !authData.user) {
        return {
          success: false,
          error: `Sign in failed: ${authError?.message || 'Invalid credentials'}`
        };
      }

      // Get complete user profile
      const userProfile = await IslamicMarriageService.getCompleteIslamicProfile(authData.user.id);

      if (!userProfile) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      // Skip activity log and users update on client – prevents 403/406 during login

      return {
        success: true,
        data: {
          authUser: authData.user,
          userProfile
        }
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * Upload media to external server and create reference
   */
  static async uploadMedia(
    userId: string,
    mediaFile: File | Blob,
    mediaType: 'photo' | 'video',
    isProfilePicture: boolean = false
  ) {
    try {
      // This would integrate with your external media server
      // For now, we'll simulate the upload
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('userId', userId);
      formData.append('type', mediaType);

      // Replace with your actual media server endpoint
      const mediaServerUrl = process.env.EXPO_PUBLIC_MEDIA_SERVER_URL;
      if (!mediaServerUrl) {
        throw new Error('Media server URL not configured');
      }

      const response = await fetch(`${mediaServerUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_MEDIA_SERVER_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Media upload failed');
      }

      const uploadResult = await response.json();

      // Create media reference in Supabase
      const { data: mediaRef, error } = await IslamicMarriageService.addMediaReference(
        userId,
        uploadResult.url,
        mediaType,
        isProfilePicture,
        uploadResult.thumbnailUrl
      );

      if (error) {
        throw new Error(`Media reference creation failed: ${error}`);
      }

      return {
        success: true,
        data: mediaRef
      };

    } catch (error) {
      console.error('Media upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Media upload failed'
      };
    }
  }

  /**
   * Validate registration data
   */
  static validateRegistrationData(data: RegistrationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!data.gender) {
      errors.push('Gender is required');
    }

    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18 || age > 100) {
        errors.push('Age must be between 18 and 100');
      }
    }

    if (!data.country?.trim()) {
      errors.push('Country is required');
    }

    if (!data.city?.trim()) {
      errors.push('City is required');
    }

    if (!data.sect) {
      errors.push('Islamic sect is required');
    }

    if (!data.maritalStatus) {
      errors.push('Marital status is required');
    }

    // Polygamy-specific validation
    if (data.gender === 'male' && data.seekingWifeNumber && data.seekingWifeNumber !== 'first') {
      if (!data.currentWivesCount || data.currentWivesCount < 1) {
        errors.push('Current wives count must be specified for polygamous preferences');
      }
      
      if (data.currentWivesCount && data.currentWivesCount >= 4) {
        errors.push('Islamic law permits maximum 4 wives');
      }
    }

    if (data.gender === 'female' && data.acceptPolygamy === 'accept') {
      if (!data.willingWifeNumber || data.willingWifeNumber.length === 0) {
        errors.push('Must specify acceptable wife positions when accepting polygamy');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get user session status
   */
  static async getCurrentUserSession() {
    try {
      const { session, error } = await auth.getSession();
      
      if (error || !session) {
        return { isAuthenticated: false };
      }

      const userProfile = await IslamicMarriageService.getCompleteIslamicProfile(session.user.id);

      return {
        isAuthenticated: true,
        session,
        userProfile
      };

    } catch (error) {
      console.error('Session check error:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Create account with just email and password
   */
  static async createAccount(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Profile will be created later during profile setup process

      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error('Account creation error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Create comprehensive profile with all dating information
   */
  static async createComprehensiveProfile(profileData: any) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { basicInfo, physicalDetails, lifestyleDetails, religiousDetails, polygamyDetails, gender } = profileData;

      // First check if profile exists (tolerate no-row case)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Only include columns that are known to exist in the DB
      const profileDataToUpsert = {
        user_id: user.id,
        first_name: basicInfo.firstName,
        last_name: basicInfo.lastName || '',
        gender: gender,
        date_of_birth: new Date(basicInfo.dateOfBirth).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        country: basicInfo.country,
        city: basicInfo.city,
        phone_code: basicInfo.phoneCode || null,
        mobile_number: basicInfo.mobileNumber || null,
        // Physical details
        height_cm: physicalDetails.height,
        weight_kg: physicalDetails.weight,
        eye_color: physicalDetails.eyeColor,
        hair_color: physicalDetails.hairColor,
        skin_tone: physicalDetails.skinColor,
        body_type: physicalDetails.bodyType,
        // Lifestyle details
        education_level: lifestyleDetails.education,
        languages_spoken: lifestyleDetails.languagesSpoken,
        occupation: lifestyleDetails.occupation,
        updated_at: new Date().toISOString(),
      };

      // Update if exists, insert if not
      const { data: profile, error: profileError } = existingProfile
        ? await supabase
            .from('user_profiles')
            .update(profileDataToUpsert)
            .eq('user_id', user.id)
            .select('*')
            .single()
        : await supabase
            .from('user_profiles')
            .insert({ ...profileDataToUpsert, created_at: new Date().toISOString() })
            .select('*')
            .single();

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // Prepare questionnaire-like data; attempt to store if column exists
      const questionnaireData = {
        religious_level: religiousDetails.religiousLevel,
        prayer_frequency: religiousDetails.prayerFrequency,
        quran_reading_level: religiousDetails.quranReading,
        hijab_practice: religiousDetails.hijabPractice,
        covering_level: gender === 'female' ? religiousDetails.coveringLevel : null,
        beard_practice: religiousDetails.beardPractice,
        seeking_wife_number: gender === 'male' ? polygamyDetails.seekingWifeNumber : null,
        accepted_wife_positions: gender === 'female' ? polygamyDetails.acceptedWifePositions : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase
          .from('user_profiles')
          .update({
            islamic_questionnaire: questionnaireData,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } catch (e) {
        console.warn('Optional questionnaire JSON update skipped:', e);
      }

      return { profile, questionnaire: profileData };
    } catch (error: any) {
      console.error('Comprehensive profile creation error:', error);
      throw new Error(error.message || 'Failed to create comprehensive profile');
    }
  }

  /**
   * Create profile with simplified preferences after basic signup
   */
  static async createProfileWithPreferences(profileData: RegistrationData, preferences: any) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // First check if profile exists (tolerate no-row case)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Only include known columns
      const profileDataToUpsert = {
        user_id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        gender: profileData.gender,
        date_of_birth: profileData.dateOfBirth,
        country: profileData.country,
        city: profileData.city,
        bio: profileData.aboutMe || '',
        phone_code: (profileData as any).phoneCode || null,
        mobile_number: (profileData as any).mobileNumber || null,
        updated_at: new Date().toISOString(),
      };

      // Update if exists, insert if not
      const { data: profile, error: profileError } = existingProfile
        ? await supabase
            .from('user_profiles')
            .update(profileDataToUpsert)
            .eq('user_id', user.id)
            .select('*')
            .single()
        : await supabase
            .from('user_profiles')
            .insert({ ...profileDataToUpsert, created_at: new Date().toISOString() })
            .select('*')
            .single();

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // Prepare simple questionnaire data for JSON column
      const simpleQuestionnaireData = {
        // Female specific
        marital_status: preferences.maritalStatus,
        accept_polygamy: preferences.acceptPolygamy || false,
        wife_positions_accepted: preferences.wifePositionsAccepted || [],
        // Male specific  
        seeking_wife_number: preferences.seekingWifeNumber || [],
        current_wives: preferences.currentWives || 0,
        max_wives: preferences.maxWives || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update the user profile to include the islamic questionnaire data in JSON column
      const { error: questionnaireError } = await supabase
        .from('user_profiles')
        .update({
          islamic_questionnaire: simpleQuestionnaireData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (questionnaireError) {
        throw new Error(`Questionnaire creation failed: ${questionnaireError.message}`);
      }

      return { profile, preferences };
    } catch (error: any) {
      console.error('Profile creation error:', error);
      throw new Error(error.message || 'Failed to create profile');
    }
  }
}

export default RegistrationService;
