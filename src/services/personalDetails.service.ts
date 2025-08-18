import { supabase } from '../config/supabase';
import type { GenderType } from '../types/database.types';

export interface PersonalDetails {
  // Essential Profile Fields (stored in main table columns)
  user_id?: string;
  first_name?: string;
  last_name?: string;
  gender?: GenderType;
  date_of_birth?: string;
  phone_code?: string;
  mobile_number?: string;
  country?: string;
  city?: string;
  
  // Physical Details (stored in main table columns)
  height_cm?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  skin_tone?: string;
  body_type?: string;
  
  // Lifestyle & Work (stored in main table columns)
  education_level?: string;
  occupation?: string;
  monthly_income?: string;
  housing_type?: string;
  living_condition?: string;
  social_condition?: string; // For males
  work_status?: string; // For females
  
  // Islamic/Religious Details (stored in islamic_questionnaire JSON column)
  religious_level?: string;
  prayer_frequency?: string;
  quran_reading_level?: string;
  covering_level?: string; // For females
  beard_practice?: string; // For males
  
  // Marriage Intentions (stored in islamic_questionnaire JSON column)
  seeking_wife_number?: string; // For males
  accepted_wife_positions?: string[]; // For females
  polygamy_preference?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface IslamicQuestionnaire {
  id?: string;
  user_id?: string;
  religious_level?: string;
  prayer_frequency?: string;
  quran_reading_level?: string;
  covering_level?: string;
  beard_practice?: string;
  seeking_wife_number?: string;
  accepted_wife_positions?: string[];
  polygamy_preference?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdatePersonalDetailsData {
  // Physical Details
  height_cm?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  skin_tone?: string;
  body_type?: string;
  
  // Lifestyle & Work
  education_level?: string;
  occupation?: string;
  monthly_income?: string;
  housing_type?: string;
  living_condition?: string;
  social_condition?: string;
  work_status?: string;
  
  // Religious Commitment
  religious_level?: string;
  prayer_frequency?: string;
  quran_reading_level?: string;
  covering_level?: string;
  beard_practice?: string;
  
  // Marriage Intentions
  seeking_wife_number?: string;
  accepted_wife_positions?: string[];
  polygamy_preference?: string;
}

export class PersonalDetailsService {
  /**
   * Get current user's complete personal details
   */
  static async getCurrentUserPersonalDetails(): Promise<PersonalDetails | null> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Fetch user profile with islamic questionnaire data (now in JSON column)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      if (!profile) {
        return null;
      }

      // Extract questionnaire data from JSON column
      const questionnaire = profile.islamic_questionnaire || {};

      // Combine profile and questionnaire data
      const personalDetails: PersonalDetails = {
        ...profile,
        // Add questionnaire fields from JSON
        religious_level: questionnaire.religious_level,
        prayer_frequency: questionnaire.prayer_frequency,
        quran_reading_level: questionnaire.quran_reading_level,
        covering_level: questionnaire.covering_level,
        beard_practice: questionnaire.beard_practice,
        seeking_wife_number: questionnaire.seeking_wife_number,
        accepted_wife_positions: questionnaire.accepted_wife_positions,
        polygamy_preference: questionnaire.polygamy_preference,
      };

      return personalDetails;
    } catch (error) {
      console.error('Get personal details error:', error);
      return null;
    }
  }

  /**
   * Update current user's personal details
   */
  static async updatePersonalDetails(updates: UpdatePersonalDetailsData): Promise<boolean> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Get current profile to merge with existing islamic_questionnaire JSON
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('islamic_questionnaire')
        .eq('user_id', user.id)
        .single();

      const currentQuestionnaire = currentProfile?.islamic_questionnaire || {};

      // Separate profile updates from questionnaire updates
      const profileUpdates: any = {};
      const questionnaireUpdates: any = {};

      // Profile fields
      if (updates.height_cm !== undefined) profileUpdates.height_cm = updates.height_cm;
      if (updates.weight_kg !== undefined) profileUpdates.weight_kg = updates.weight_kg;
      if (updates.eye_color !== undefined) profileUpdates.eye_color = updates.eye_color;
      if (updates.hair_color !== undefined) profileUpdates.hair_color = updates.hair_color;
      if (updates.skin_tone !== undefined) profileUpdates.skin_tone = updates.skin_tone;
      if (updates.body_type !== undefined) profileUpdates.body_type = updates.body_type;
      if (updates.education_level !== undefined) profileUpdates.education_level = updates.education_level;
      if (updates.occupation !== undefined) profileUpdates.occupation = updates.occupation;
      if (updates.monthly_income !== undefined) profileUpdates.monthly_income = updates.monthly_income;
      if (updates.housing_type !== undefined) profileUpdates.housing_type = updates.housing_type;
      if (updates.living_condition !== undefined) profileUpdates.living_condition = updates.living_condition;
      if (updates.social_condition !== undefined) profileUpdates.social_condition = updates.social_condition;
      if (updates.work_status !== undefined) profileUpdates.work_status = updates.work_status;

      // Questionnaire fields
      if (updates.religious_level !== undefined) questionnaireUpdates.religious_level = updates.religious_level;
      if (updates.prayer_frequency !== undefined) questionnaireUpdates.prayer_frequency = updates.prayer_frequency;
      if (updates.quran_reading_level !== undefined) questionnaireUpdates.quran_reading_level = updates.quran_reading_level;
      if (updates.covering_level !== undefined) questionnaireUpdates.covering_level = updates.covering_level;
      if (updates.beard_practice !== undefined) questionnaireUpdates.beard_practice = updates.beard_practice;
      if (updates.seeking_wife_number !== undefined) questionnaireUpdates.seeking_wife_number = updates.seeking_wife_number;
      if (updates.accepted_wife_positions !== undefined) questionnaireUpdates.accepted_wife_positions = updates.accepted_wife_positions;
      if (updates.polygamy_preference !== undefined) questionnaireUpdates.polygamy_preference = updates.polygamy_preference;

      // Prepare the complete update object
      const allUpdates: any = {
        ...profileUpdates,
        updated_at: new Date().toISOString(),
      };

      // If there are questionnaire updates, merge them with existing questionnaire data
      if (Object.keys(questionnaireUpdates).length > 0) {
        questionnaireUpdates.updated_at = new Date().toISOString();
        allUpdates.islamic_questionnaire = {
          ...currentQuestionnaire,
          ...questionnaireUpdates,
        };
      }

      // Update the user profile with all changes in a single operation
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(allUpdates)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Update personal details error:', error);
      throw error;
    }
  }

  /**
   * Get user's personal details by user ID (for viewing other profiles)
   */
  static async getUserPersonalDetails(userId: string): Promise<PersonalDetails | null> {
    try {
      // Fetch user profile with islamic questionnaire data (now in JSON column)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return null; // No profile found
        }
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      if (!profile) {
        return null;
      }

      // Extract questionnaire data from JSON column
      const questionnaire = profile.islamic_questionnaire || {};

      // Combine profile and questionnaire data
      const personalDetails: PersonalDetails = {
        ...profile,
        // Add questionnaire fields from JSON
        religious_level: questionnaire.religious_level,
        prayer_frequency: questionnaire.prayer_frequency,
        quran_reading_level: questionnaire.quran_reading_level,
        covering_level: questionnaire.covering_level,
        beard_practice: questionnaire.beard_practice,
        seeking_wife_number: questionnaire.seeking_wife_number,
        accepted_wife_positions: questionnaire.accepted_wife_positions,
        polygamy_preference: questionnaire.polygamy_preference,
      };

      return personalDetails;
    } catch (error) {
      console.error('Get user personal details error:', error);
      return null;
    }
  }

  /**
   * Check if user has completed their personal details
   */
  static async hasCompletedPersonalDetails(): Promise<boolean> {
    try {
      const personalDetails = await this.getCurrentUserPersonalDetails();
      
      if (!personalDetails) return false;

      // Check if essential fields are filled
      const requiredFields = [
        'height_cm',
        'body_type',
        'education_level',
        'housing_type',
        'living_condition',
        'religious_level',
        'prayer_frequency',
        'quran_reading_level'
      ];

      return requiredFields.every(field => 
        personalDetails[field as keyof PersonalDetails] !== null && 
        personalDetails[field as keyof PersonalDetails] !== undefined &&
        personalDetails[field as keyof PersonalDetails] !== ''
      );
    } catch (error) {
      console.error('Check completed personal details error:', error);
      return false;
    }
  }
}

export default PersonalDetailsService;
