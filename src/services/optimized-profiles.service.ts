/**
 * Optimized Profiles Service - Uses materialized view for maximum performance
 */

import { supabase } from '../config/supabase';
import { images } from '../../constants';

// Locale-robust variant maps for religion-related fields
const RELIGIOUS_LEVEL_VARIANTS: Record<string, string[]> = {
  very_religious: ['Very Religious','Çok Dindar','متدين جداً','Très religieux','Очень религиозный'],
  religious: ['Religious','Dindar','متدين','Religieux','Религиозный'],
  moderately_religious: ['Moderately Religious','Orta Derece Dindar','متدين بشكل معتدل','Modérément religieux','Умеренно религиозный'],
  somewhat_religious: ['Somewhat Religious','Biraz Dindar','متدين نوعاً ما','Quelque peu religieux','Несколько религиозный'],
  learning: ['Learning','Öğreniyor','يتعلم','Apprenant','Изучает']
};
const PRAYER_FREQUENCY_VARIANTS: Record<string, string[]> = {
  all_5_daily_prayers: ['All 5 Daily Prayers','Günün 5 Vakti','كل الصلوات الخمس','Les 5 prières quotidiennes','Все 5 ежедневных молитв'],
  most_prayers: ['Most Prayers','Çoğu Vakit','أغلب الصلوات','La plupart des prières','Большинство молитв'],
  some_prayers: ['Some Prayers','Bazı Vakitler','بعض الصلوات','Quelques prières','Некоторые молитвы'],
  friday_only: ['Friday Only','Sadece Cuma','الجمعة فقط','Vendredi seulement','Только в пятницу'],
  occasionally: ['Occasionally','Ara sıra','أحياناً','Occasionnellement','Иногда'],
  learning_to_pray: ['Learning to Pray','Namaz Kılmayı Öğreniyor','يتعلم الصلاة','Apprend à prier','Учится молиться']
};
const QURAN_READING_VARIANTS: Record<string, string[]> = {
  memorized_significant_portions: ['Memorized Significant Portions','Önemli Bölümleri Ezberlemiş','حفظ أجزاء كبيرة','Mémorisé des portions importantes','Выучил значительные части'],
  read_fluently: ['Read Fluently','Akıcı Okuyor','يقرأ بطلاقة','Lit couramment','Читает свободно'],
  read_with_help: ['Read with Help','Yardımla Okuyor','يقرأ بمساعدة','Lit avec aide','Читает с помощью'],
  learning_to_read: ['Learning to Read','Okumayı Öğreniyor','يتعلم القراءة','Apprend à lire','Учится читать'],
  cannot_read_arabic: ['Cannot Read Arabic','Arapça Okuyamıyor','لا يستطيع قراءة العربية','Ne peut pas lire l\'arabe','Не может читать по-арабски']
};
const COVERING_LEVEL_VARIANTS: Record<string, string[]> = {
  will_cover: ['Will Cover','Örtünecek','ستتحجب','Se couvrira','Будет покрываться'],
  hijab: ['Hijab','Başörtüsü','حجاب','Hijab','Хиджаб'],
  niqab: ['Niqab','Peçe','نقاب','Niqab','Никаб']
};
const BEARD_PRACTICE_VARIANTS: Record<string, string[]> = {
  full_beard: ['Full Beard','Tam Sakal','لحية كاملة','Barbe complète','Полная борода'],
  trimmed_beard: ['Trimmed Beard','Kırpılmış Sakal','لحية مهذبة','Barbe taillée','Подстриженная борода'],
  mustache_only: ['Mustache Only','Sadece Bıyık','شارب فقط','Moustache seulement','Только усы'],
  clean_shaven: ['Clean Shaven','Temiz Tıraşlı','حليق','Rasé de près','Чисто выбрит']
};

function buildLocaleInListFromSelected(selected: string[] = [], variants: Record<string, string[]>): string {
  const values = new Set<string>();
  for (const sel of selected) {
    const escapedSel = String(sel).replace(/\"/g, '\\\"').replace(/"/g, '\\"');
    values.add(escapedSel);
    for (const [key, list] of Object.entries(variants)) {
      if (key === sel || list.includes(sel)) {
        for (const v of list) values.add(String(v).replace(/\"/g, '\\\"').replace(/"/g, '\\"'));
      }
    }
  }
  return `("${Array.from(values).join('","')}")`;
}

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
        // Additional rule: male users should not see unapproved female profiles
        if (oppositeGender === 'female') {
          query = query.eq('admin_approved', true);
        }
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
      // Social condition applies to male-targeted filtering only
      if (filters.selectedSocialCondition?.length && currentUserGender && currentUserGender.toLowerCase() === 'female') {
        // female user -> opposite gender male
        query = query.in('social_condition', filters.selectedSocialCondition);
      }
      if (filters.selectedWorkStatus?.length) {
        query = query.in('work_status', filters.selectedWorkStatus);
      }

      // Apply language filter
      if (filters.selectedLanguages?.length) {
        query = query.contains('languages_spoken', filters.selectedLanguages);
      }

      // Apply religious filters (JSON fields) with locale-robust expansion
      if (filters.selectedReligiousLevel?.length) {
        const list = buildLocaleInListFromSelected(filters.selectedReligiousLevel, RELIGIOUS_LEVEL_VARIANTS);
        query = query.filter('islamic_questionnaire->>religious_level', 'in', list);
      }
      if (filters.selectedPrayerFrequency?.length) {
        const list = buildLocaleInListFromSelected(filters.selectedPrayerFrequency, PRAYER_FREQUENCY_VARIANTS);
        query = query.filter('islamic_questionnaire->>prayer_frequency', 'in', list);
      }
      if (filters.selectedQuranReading?.length) {
        const list = buildLocaleInListFromSelected(filters.selectedQuranReading, QURAN_READING_VARIANTS);
        query = query.filter('islamic_questionnaire->>quran_reading_level', 'in', list);
      }

      // Apply gender-specific religious filters
      const oppositeGender = currentUserGender?.toLowerCase() === 'male' ? 'female' : 'male';
      if (oppositeGender === 'female') {
        if (filters.selectedCoveringLevel?.length) {
          const list = buildLocaleInListFromSelected(filters.selectedCoveringLevel, COVERING_LEVEL_VARIANTS);
          if (filters.selectedCoveringLevel.length === 3) {
            query = query.or(`islamic_questionnaire->>covering_level.in.${list},islamic_questionnaire->>covering_level.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>covering_level', 'in', list);
          }
        }
        if (filters.selectedAcceptedWifePositions?.length) {
          // Match ANY position via OR expression
          const orExpr = filters.selectedAcceptedWifePositions
            .map(p => `islamic_questionnaire->accepted_wife_positions.cs.[\"${p}\"]`)
            .join(',');
          // @ts-ignore - supabase-js .or supported
          query = (query as any).or(orExpr);
        }
      }
      if (oppositeGender === 'male') {
        if (filters.selectedBeardPractice?.length) {
          const list = buildLocaleInListFromSelected(filters.selectedBeardPractice, BEARD_PRACTICE_VARIANTS);
          if (filters.selectedBeardPractice.length === 4) {
            query = query.or(`islamic_questionnaire->>beard_practice.in.${list},islamic_questionnaire->>beard_practice.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>beard_practice', 'in', list);
          }
        }
        if (filters.selectedSeekingWifeNumber?.length) {
          const list = `("${filters.selectedSeekingWifeNumber.map(v=>String(v).replace(/\"/g,'\\\"')).join('","')}")`;
          if (filters.selectedSeekingWifeNumber.length === 3) {
            query = query.or(`islamic_questionnaire->>seeking_wife_number.in.${list},islamic_questionnaire->>seeking_wife_number.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>seeking_wife_number', 'in', list);
          }
        }
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
        // Additional rule: male users should not see unapproved female profiles
        if (oppositeGender === 'female') {
          baseQuery = baseQuery.eq('admin_approved', true);
        }
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

  /**
   * Get filtered count matching current filters (full fidelity)
   */
  static async getFilteredCount(
    filters: OptimizedProfileFilters = {},
    currentUserGender?: string | null
  ): Promise<number> {
    try {
      // Build count query mirroring fetchOptimizedProfiles filters
      // Use raw user_profiles to match the home list source and avoid stale MV
      let query = supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true);

      // Gender filter (opposite gender)
      if (currentUserGender) {
        const oppositeGender = currentUserGender.toLowerCase() === 'male' ? 'female' : 'male';
        query = query.eq('gender', oppositeGender);
        // Additional rule: male users should not count unapproved female profiles
        if (oppositeGender === 'female') {
          query = query.eq('admin_approved', true);
        }
      }

      // Location filters
      if (filters.selectedCountry) {
        query = query.eq('country', filters.selectedCountry);
      }
      if (filters.selectedCity) {
        query = query.eq('city', filters.selectedCity);
      }

      // Age filters (convert to date_of_birth bounds on base table)
      if (filters.ageRange && filters.ageRange[0] > 0 && filters.ageRange[1] > 0) {
        const [minAge, maxAge] = filters.ageRange;
        if (!(minAge === 20 && maxAge === 50)) {
          const now = new Date();
          const lowerDob = new Date(now); // now - maxAge years
          lowerDob.setFullYear(lowerDob.getFullYear() - maxAge);
          const upperDob = new Date(now); // now - minAge years
          upperDob.setFullYear(upperDob.getFullYear() - minAge);
          const toIsoDate = (d: Date) => d.toISOString().split('T')[0];
          query = query.gte('date_of_birth', toIsoDate(lowerDob)).lte('date_of_birth', toIsoDate(upperDob));
        }
      }

      // Physical filters
      if (filters.heightRange && !(filters.heightRange[0] === 150 && filters.heightRange[1] === 200)) {
        query = query.gte('height_cm', filters.heightRange[0]).lte('height_cm', filters.heightRange[1]);
      }
      if (filters.weightRange && !(filters.weightRange[0] === 40 && filters.weightRange[1] === 120)) {
        query = query.gte('weight_kg', filters.weightRange[0]).lte('weight_kg', filters.weightRange[1]);
      }
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

      // Lifestyle filters
      if (filters.selectedEducation?.length) {
        query = query.in('education_level', filters.selectedEducation);
      }
      if (filters.selectedHousingType?.length) {
        query = query.in('housing_type', filters.selectedHousingType);
      }
      if (filters.selectedLivingCondition?.length) {
        query = query.in('living_condition', filters.selectedLivingCondition);
      }
      // Social condition applies only when targeting male profiles
      if (filters.selectedSocialCondition?.length && currentUserGender && currentUserGender.toLowerCase() === 'female') {
        query = query.in('social_condition', filters.selectedSocialCondition);
      }
      if (filters.selectedWorkStatus?.length) {
        query = query.in('work_status', filters.selectedWorkStatus);
      }

      // Languages
      if (filters.selectedLanguages?.length) {
        query = query.contains('languages_spoken', filters.selectedLanguages);
      }

      // Religious filters (JSON) with locale-robust expansion
      if (filters.selectedReligiousLevel?.length) {
        const list = buildLocaleInListFromSelected(filters.selectedReligiousLevel, RELIGIOUS_LEVEL_VARIANTS);
        query = query.filter('islamic_questionnaire->>religious_level', 'in', list);
      }
      if (filters.selectedPrayerFrequency?.length) {
        const list = buildLocaleInListFromSelected(filters.selectedPrayerFrequency, PRAYER_FREQUENCY_VARIANTS);
        query = query.filter('islamic_questionnaire->>prayer_frequency', 'in', list);
      }
      if (filters.selectedQuranReading?.length) {
        const list = buildLocaleInListFromSelected(filters.selectedQuranReading, QURAN_READING_VARIANTS);
        query = query.filter('islamic_questionnaire->>quran_reading_level', 'in', list);
      }

      // Gender-specific religious filters
      const oppositeGender = currentUserGender?.toLowerCase() === 'male' ? 'female' : 'male';
      if (oppositeGender === 'female') {
        if (filters.selectedCoveringLevel?.length) {
          const list = buildLocaleInListFromSelected(filters.selectedCoveringLevel, COVERING_LEVEL_VARIANTS);
          if (filters.selectedCoveringLevel.length === 3) {
            query = query.or(`islamic_questionnaire->>covering_level.in.${list},islamic_questionnaire->>covering_level.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>covering_level', 'in', list);
          }
        }
        if (filters.selectedAcceptedWifePositions?.length) {
          filters.selectedAcceptedWifePositions.forEach(position => {
            query = query.filter('islamic_questionnaire->accepted_wife_positions', 'cs', `["${position}"]`);
          });
        }
      }
      if (oppositeGender === 'male') {
        if (filters.selectedBeardPractice?.length) {
          const list = buildLocaleInListFromSelected(filters.selectedBeardPractice, BEARD_PRACTICE_VARIANTS);
          if (filters.selectedBeardPractice.length === 4) {
            query = query.or(`islamic_questionnaire->>beard_practice.in.${list},islamic_questionnaire->>beard_practice.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>beard_practice', 'in', list);
          }
        }
        if (filters.selectedSeekingWifeNumber?.length) {
          // If all wife number options are selected, include null/missing values too
          if (filters.selectedSeekingWifeNumber.length === 3) {
            query = query.or(`islamic_questionnaire->>seeking_wife_number.in.("${filters.selectedSeekingWifeNumber.join('","')}"),islamic_questionnaire->>seeking_wife_number.is.null,islamic_questionnaire.is.null`);
          } else {
            query = query.filter('islamic_questionnaire->>seeking_wife_number', 'in', `("${filters.selectedSeekingWifeNumber.join('","')}")`);
          }
        }
      }

      // Search (basic fallback on base table fields)
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const term = filters.searchQuery.trim().replace(/%/g, '').replace(/\s+/g, ' ');
        const like = `%${term}%`;
        query = query.or(`first_name.ilike.${like},city.ilike.${like},country.ilike.${like}`);
      }

      const { count, error } = await query;
      if (error) {
        console.error('Filtered count error:', error);
        return 0;
      }
      return count || 0;
    } catch (error: any) {
      console.error('Failed to get filtered count:', error);
      return 0;
    }
  }
}
