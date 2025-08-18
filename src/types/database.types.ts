// TypeScript types generated from the Islamic Marriage Database Schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type GenderType = 'male' | 'female';
export type MaritalStatusType = 'never_married' | 'divorced' | 'widowed';
export type EducationLevelType = 
  | 'no_formal_education' 
  | 'primary' 
  | 'secondary' 
  | 'high_school' 
  | 'diploma' 
  | 'bachelor' 
  | 'master' 
  | 'doctorate' 
  | 'islamic_studies';
export type OccupationCategoryType = 
  | 'student' 
  | 'professional' 
  | 'business' 
  | 'religious_scholar' 
  | 'homemaker' 
  | 'retired' 
  | 'other';
export type SectType = 'sunni' | 'shia' | 'other';
export type MadhabType = 'hanafi' | 'maliki' | 'shafii' | 'hanbali' | 'jafari' | 'other';
export type PrayerFrequencyType = 
  | 'five_times_daily' 
  | 'regularly' 
  | 'sometimes' 
  | 'rarely' 
  | 'prefer_not_to_say';
export type HijabType = 'full_hijab' | 'partial_hijab' | 'niqab' | 'no_hijab' | 'not_applicable';
export type BeardType = 'full_beard' | 'trimmed_beard' | 'mustache_only' | 'clean_shaven' | 'not_applicable';
export type PolygamyPreferenceType = 'accept' | 'maybe' | 'no' | 'not_applicable';
export type WifeNumberType = 'first' | 'second' | 'third' | 'fourth';
export type SeekingWifeNumberType = 'first' | 'second' | 'third' | 'fourth' | 'any';
export type EyeColorType = 'brown' | 'black' | 'hazel' | 'green' | 'blue' | 'gray' | 'amber';
export type HairColorType = 'black' | 'dark_brown' | 'light_brown' | 'blonde' | 'red' | 'gray' | 'white' | 'other';
export type SkinToneType = 'very_fair' | 'fair' | 'medium' | 'olive' | 'dark' | 'very_dark';
export type BodyTypeType = 'slim' | 'athletic' | 'average' | 'curvy' | 'heavy_set';
export type VerificationStatusType = 'pending' | 'verified' | 'rejected';
export type ProfileStatusType = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          profile_status: ProfileStatusType;
          is_verified: boolean;
          verification_documents_submitted: boolean;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          profile_status?: ProfileStatusType;
          is_verified?: boolean;
          verification_documents_submitted?: boolean;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          profile_status?: ProfileStatusType;
          is_verified?: boolean;
          verification_documents_submitted?: boolean;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          gender: GenderType;
          date_of_birth: string;
          age: number;
          height_cm: number | null;
          weight_kg: number | null;
          eye_color: EyeColorType | null;
          hair_color: HairColorType | null;
          skin_tone: SkinToneType | null;
          body_type: BodyTypeType | null;
          country: string | null;
          state_province: string | null;
          city: string | null;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          willing_to_relocate: boolean;
          sect: SectType | null;
          madhab: MadhabType | null;
          prayer_frequency: PrayerFrequencyType | null;
          quran_memorization_level: string | null;
          islamic_education_level: string | null;
          hajj_performed: boolean;
          umrah_performed: boolean;
          hijab_style: HijabType | null;
          beard_style: BeardType | null;
          marital_status: MaritalStatusType;
          has_children: boolean;
          number_of_children: number;
          children_living_with_user: boolean;
          wants_children: boolean | null;
          accept_polygamy: PolygamyPreferenceType | null;
          willing_wife_number: WifeNumberType[] | null;
          seeking_wife_number: SeekingWifeNumberType | null;
          current_wives_count: number;
          education_level: EducationLevelType | null;
          field_of_study: string | null;
          occupation: string | null;
          occupation_category: OccupationCategoryType | null;
          annual_income_range: string | null;
          employment_status: string | null;
          father_occupation: string | null;
          mother_occupation: string | null;
          number_of_siblings: number | null;
          family_religious_level: string | null;
          family_financial_status: string | null;
          bio: string | null;
          hobbies: string[] | null;
          languages_spoken: string[] | null;
          looking_for: string | null;
          profile_verified_at: string | null;
          profile_verification_status: VerificationStatusType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          gender: GenderType;
          date_of_birth: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          eye_color?: EyeColorType | null;
          hair_color?: HairColorType | null;
          skin_tone?: SkinToneType | null;
          body_type?: BodyTypeType | null;
          country?: string | null;
          state_province?: string | null;
          city?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          willing_to_relocate?: boolean;
          sect?: SectType | null;
          madhab?: MadhabType | null;
          prayer_frequency?: PrayerFrequencyType | null;
          quran_memorization_level?: string | null;
          islamic_education_level?: string | null;
          hajj_performed?: boolean;
          umrah_performed?: boolean;
          hijab_style?: HijabType | null;
          beard_style?: BeardType | null;
          marital_status: MaritalStatusType;
          has_children?: boolean;
          number_of_children?: number;
          children_living_with_user?: boolean;
          wants_children?: boolean | null;
          accept_polygamy?: PolygamyPreferenceType | null;
          willing_wife_number?: WifeNumberType[] | null;
          seeking_wife_number?: SeekingWifeNumberType | null;
          current_wives_count?: number;
          education_level?: EducationLevelType | null;
          field_of_study?: string | null;
          occupation?: string | null;
          occupation_category?: OccupationCategoryType | null;
          annual_income_range?: string | null;
          employment_status?: string | null;
          father_occupation?: string | null;
          mother_occupation?: string | null;
          number_of_siblings?: number | null;
          family_religious_level?: string | null;
          family_financial_status?: string | null;
          bio?: string | null;
          hobbies?: string[] | null;
          languages_spoken?: string[] | null;
          looking_for?: string | null;
          profile_verified_at?: string | null;
          profile_verification_status?: VerificationStatusType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          gender?: GenderType;
          date_of_birth?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          eye_color?: EyeColorType | null;
          hair_color?: HairColorType | null;
          skin_tone?: SkinToneType | null;
          body_type?: BodyTypeType | null;
          country?: string | null;
          state_province?: string | null;
          city?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          willing_to_relocate?: boolean;
          sect?: SectType | null;
          madhab?: MadhabType | null;
          prayer_frequency?: PrayerFrequencyType | null;
          quran_memorization_level?: string | null;
          islamic_education_level?: string | null;
          hajj_performed?: boolean;
          umrah_performed?: boolean;
          hijab_style?: HijabType | null;
          beard_style?: BeardType | null;
          marital_status?: MaritalStatusType;
          has_children?: boolean;
          number_of_children?: number;
          children_living_with_user?: boolean;
          wants_children?: boolean | null;
          accept_polygamy?: PolygamyPreferenceType | null;
          willing_wife_number?: WifeNumberType[] | null;
          seeking_wife_number?: SeekingWifeNumberType | null;
          current_wives_count?: number;
          education_level?: EducationLevelType | null;
          field_of_study?: string | null;
          occupation?: string | null;
          occupation_category?: OccupationCategoryType | null;
          annual_income_range?: string | null;
          employment_status?: string | null;
          father_occupation?: string | null;
          mother_occupation?: string | null;
          number_of_siblings?: number | null;
          family_religious_level?: string | null;
          family_financial_status?: string | null;
          bio?: string | null;
          hobbies?: string[] | null;
          languages_spoken?: string[] | null;
          looking_for?: string | null;
          profile_verified_at?: string | null;
          profile_verification_status?: VerificationStatusType;
          created_at?: string;
          updated_at?: string;
        };
      };
      media_references: {
        Row: {
          id: string;
          user_id: string;
          media_type: string;
          external_url: string;
          thumbnail_url: string | null;
          media_order: number;
          is_profile_picture: boolean;
          is_verified: boolean;
          upload_date: string;
          file_size_bytes: number | null;
          mime_type: string | null;
          visibility_level: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_type: string;
          external_url: string;
          thumbnail_url?: string | null;
          media_order?: number;
          is_profile_picture?: boolean;
          is_verified?: boolean;
          upload_date?: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          visibility_level?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_type?: string;
          external_url?: string;
          thumbnail_url?: string | null;
          media_order?: number;
          is_profile_picture?: boolean;
          is_verified?: boolean;
          upload_date?: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          visibility_level?: string;
          created_at?: string;
        };
      };
      partner_preferences: {
        Row: {
          id: string;
          user_id: string;
          min_age: number | null;
          max_age: number | null;
          min_height_cm: number | null;
          max_height_cm: number | null;
          preferred_eye_colors: EyeColorType[] | null;
          preferred_hair_colors: HairColorType[] | null;
          preferred_skin_tones: SkinToneType[] | null;
          preferred_body_types: BodyTypeType[] | null;
          preferred_countries: string[] | null;
          preferred_states: string[] | null;
          max_distance_km: number | null;
          accept_international: boolean;
          preferred_sects: SectType[] | null;
          preferred_madhabs: MadhabType[] | null;
          min_prayer_frequency: PrayerFrequencyType | null;
          prefer_hafiz: boolean;
          prefer_islamic_education: boolean;
          prefer_hajj_performed: boolean;
          preferred_hijab_styles: HijabType[] | null;
          preferred_beard_styles: BeardType[] | null;
          preferred_marital_status: MaritalStatusType[] | null;
          accept_divorced: boolean;
          accept_widowed: boolean;
          accept_with_children: boolean;
          want_children_together: boolean | null;
          accept_polygamous_marriage: PolygamyPreferenceType;
          preferred_wife_positions: SeekingWifeNumberType[] | null;
          min_education_level: EducationLevelType | null;
          preferred_occupations: string[] | null;
          min_income_expectation: string | null;
          preferred_languages: string[] | null;
          deal_breakers: string[] | null;
          important_qualities: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          min_age?: number | null;
          max_age?: number | null;
          min_height_cm?: number | null;
          max_height_cm?: number | null;
          preferred_eye_colors?: EyeColorType[] | null;
          preferred_hair_colors?: HairColorType[] | null;
          preferred_skin_tones?: SkinToneType[] | null;
          preferred_body_types?: BodyTypeType[] | null;
          preferred_countries?: string[] | null;
          preferred_states?: string[] | null;
          max_distance_km?: number | null;
          accept_international?: boolean;
          preferred_sects?: SectType[] | null;
          preferred_madhabs?: MadhabType[] | null;
          min_prayer_frequency?: PrayerFrequencyType | null;
          prefer_hafiz?: boolean;
          prefer_islamic_education?: boolean;
          prefer_hajj_performed?: boolean;
          preferred_hijab_styles?: HijabType[] | null;
          preferred_beard_styles?: BeardType[] | null;
          preferred_marital_status?: MaritalStatusType[] | null;
          accept_divorced?: boolean;
          accept_widowed?: boolean;
          accept_with_children?: boolean;
          want_children_together?: boolean | null;
          accept_polygamous_marriage?: PolygamyPreferenceType;
          preferred_wife_positions?: SeekingWifeNumberType[] | null;
          min_education_level?: EducationLevelType | null;
          preferred_occupations?: string[] | null;
          min_income_expectation?: string | null;
          preferred_languages?: string[] | null;
          deal_breakers?: string[] | null;
          important_qualities?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          min_age?: number | null;
          max_age?: number | null;
          min_height_cm?: number | null;
          max_height_cm?: number | null;
          preferred_eye_colors?: EyeColorType[] | null;
          preferred_hair_colors?: HairColorType[] | null;
          preferred_skin_tones?: SkinToneType[] | null;
          preferred_body_types?: BodyTypeType[] | null;
          preferred_countries?: string[] | null;
          preferred_states?: string[] | null;
          max_distance_km?: number | null;
          accept_international?: boolean;
          preferred_sects?: SectType[] | null;
          preferred_madhabs?: MadhabType[] | null;
          min_prayer_frequency?: PrayerFrequencyType | null;
          prefer_hafiz?: boolean;
          prefer_islamic_education?: boolean;
          prefer_hajj_performed?: boolean;
          preferred_hijab_styles?: HijabType[] | null;
          preferred_beard_styles?: BeardType[] | null;
          preferred_marital_status?: MaritalStatusType[] | null;
          accept_divorced?: boolean;
          accept_widowed?: boolean;
          accept_with_children?: boolean;
          want_children_together?: boolean | null;
          accept_polygamous_marriage?: PolygamyPreferenceType;
          preferred_wife_positions?: SeekingWifeNumberType[] | null;
          min_education_level?: EducationLevelType | null;
          preferred_occupations?: string[] | null;
          min_income_expectation?: string | null;
          preferred_languages?: string[] | null;
          deal_breakers?: string[] | null;
          important_qualities?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          match_score: number | null;
          matched_at: string;
          user1_status: string;
          user2_status: string;
          is_mutual_match: boolean;
          conversation_started: boolean;
          conversation_started_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          match_score?: number | null;
          matched_at?: string;
          user1_status?: string;
          user2_status?: string;
          is_mutual_match?: boolean;
          conversation_started?: boolean;
          conversation_started_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          match_score?: number | null;
          matched_at?: string;
          user1_status?: string;
          user2_status?: string;
          is_mutual_match?: boolean;
          conversation_started?: boolean;
          conversation_started_at?: string | null;
          created_at?: string;
        };
      };
      verification_documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          external_document_url: string;
          verification_status: VerificationStatusType;
          verified_by: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          external_document_url: string;
          verification_status?: VerificationStatusType;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          external_document_url?: string;
          verification_status?: VerificationStatusType;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      islamic_questionnaire: {
        Row: {
          id: string;
          user_id: string;
          daily_prayers_consistency: number | null;
          friday_prayers_attendance: string | null;
          quran_reading_frequency: string | null;
          islamic_knowledge_level: string | null;
          religious_events_participation: string | null;
          gender_roles_view: string | null;
          family_planning_view: string | null;
          religious_education_children: string | null;
          spouse_religious_expectations: string | null;
          halal_food_strictness: string | null;
          music_entertainment_view: string | null;
          social_media_usage: string | null;
          modesty_interpretation: string | null;
          polygamy_understanding: string | null;
          polygamy_comfort_level: number | null;
          co_wife_relationship_expectations: string | null;
          multiple_wives_management_plan: string | null;
          financial_responsibility_view: string | null;
          time_sharing_expectations: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_prayers_consistency?: number | null;
          friday_prayers_attendance?: string | null;
          quran_reading_frequency?: string | null;
          islamic_knowledge_level?: string | null;
          religious_events_participation?: string | null;
          gender_roles_view?: string | null;
          family_planning_view?: string | null;
          religious_education_children?: string | null;
          spouse_religious_expectations?: string | null;
          halal_food_strictness?: string | null;
          music_entertainment_view?: string | null;
          social_media_usage?: string | null;
          modesty_interpretation?: string | null;
          polygamy_understanding?: string | null;
          polygamy_comfort_level?: number | null;
          co_wife_relationship_expectations?: string | null;
          multiple_wives_management_plan?: string | null;
          financial_responsibility_view?: string | null;
          time_sharing_expectations?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_prayers_consistency?: number | null;
          friday_prayers_attendance?: string | null;
          quran_reading_frequency?: string | null;
          islamic_knowledge_level?: string | null;
          religious_events_participation?: string | null;
          gender_roles_view?: string | null;
          family_planning_view?: string | null;
          religious_education_children?: string | null;
          spouse_religious_expectations?: string | null;
          halal_food_strictness?: string | null;
          music_entertainment_view?: string | null;
          social_media_usage?: string | null;
          modesty_interpretation?: string | null;
          polygamy_understanding?: string | null;
          polygamy_comfort_level?: number | null;
          co_wife_relationship_expectations?: string | null;
          multiple_wives_management_plan?: string | null;
          financial_responsibility_view?: string | null;
          time_sharing_expectations?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          activity_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          activity_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          activity_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_match_score: {
        Args: {
          user1_uuid: string;
          user2_uuid: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Additional utility types for the application
export interface UserWithProfile {
  user: Database['public']['Tables']['users']['Row'];
  profile: Database['public']['Tables']['user_profiles']['Row'];
  preferences?: Database['public']['Tables']['partner_preferences']['Row'];
  media?: Database['public']['Tables']['media_references']['Row'][];
  questionnaire?: Database['public']['Tables']['islamic_questionnaire']['Row'];
}

export interface MatchWithProfiles {
  match: Database['public']['Tables']['user_matches']['Row'];
  user1_profile: Database['public']['Tables']['user_profiles']['Row'];
  user2_profile: Database['public']['Tables']['user_profiles']['Row'];
}

// Form types for creating/updating data
export type CreateUserProfile = Database['public']['Tables']['user_profiles']['Insert'];
export type UpdateUserProfile = Database['public']['Tables']['user_profiles']['Update'];
export type CreatePartnerPreferences = Database['public']['Tables']['partner_preferences']['Insert'];
export type UpdatePartnerPreferences = Database['public']['Tables']['partner_preferences']['Update'];
export type CreateMediaReference = Database['public']['Tables']['media_references']['Insert'];
export type CreateIslamicQuestionnaire = Database['public']['Tables']['islamic_questionnaire']['Insert'];

// Search and filter types
export interface ProfileSearchFilters {
  gender?: GenderType;
  minAge?: number;
  maxAge?: number;
  country?: string;
  state?: string;
  city?: string;
  sect?: SectType;
  madhab?: MadhabType;
  maritalStatus?: MaritalStatusType;
  educationLevel?: EducationLevelType;
  prayerFrequency?: PrayerFrequencyType;
  acceptPolygamy?: PolygamyPreferenceType;
  seekingWifeNumber?: SeekingWifeNumberType;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  hajjPerformed?: boolean;
  umrahPerformed?: boolean;
  maxDistance?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface MatchPreferences extends ProfileSearchFilters {
  dealBreakers?: string[];
  importantQualities?: string[];
  preferredLanguages?: string[];
}
