-- ============================================================================
-- OPTIMIZED HOME PROFILES VIEW - HUME DATING APP
-- ============================================================================
-- Creates an optimized materialized view for home screen profile loading
-- Pre-computes age, combines profile and media data, and optimizes for filtering
-- ============================================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS optimized_home_profiles CASCADE;
DROP VIEW IF EXISTS optimized_home_profiles CASCADE;

-- Create optimized materialized view for home profiles
CREATE MATERIALIZED VIEW optimized_home_profiles AS
SELECT 
  -- Core profile data
  up.id,
  up.user_id,
  up.first_name,
  up.gender,
  up.height_cm,
  up.weight_kg,
  up.city,
  up.country,
  up.eye_color,
  up.hair_color,
  up.skin_tone,
  up.body_type,
  up.education_level,
  up.languages_spoken,
  up.housing_type,
  up.living_condition,
  up.social_condition,
  up.work_status,
  up.islamic_questionnaire,
  up.created_at,
  up.is_public,
  up.admin_approved,
  
  -- Pre-computed age (major performance boost)
  EXTRACT(YEAR FROM AGE(up.date_of_birth)) AS age,
  
  -- Optimized profile picture URL (combines both sources)
  COALESCE(
    up.profile_picture_url,
    mr.do_spaces_cdn_url,
    mr.do_spaces_url,
    mr.external_url
  ) AS optimized_image_url,
  
  -- Gender-specific computed fields for faster filtering
  CASE 
    WHEN up.gender = 'female' THEN 1 
    ELSE 0 
  END AS is_female,
  
  -- Age ranges for faster filtering (pre-computed buckets)
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(up.date_of_birth)) BETWEEN 18 AND 25 THEN '18-25'
    WHEN EXTRACT(YEAR FROM AGE(up.date_of_birth)) BETWEEN 26 AND 35 THEN '26-35'
    WHEN EXTRACT(YEAR FROM AGE(up.date_of_birth)) BETWEEN 36 AND 45 THEN '36-45'
    WHEN EXTRACT(YEAR FROM AGE(up.date_of_birth)) BETWEEN 46 AND 60 THEN '46-60'
    ELSE '60+'
  END AS age_range,
  
  -- Height ranges for faster filtering
  CASE 
    WHEN up.height_cm BETWEEN 150 AND 160 THEN '150-160'
    WHEN up.height_cm BETWEEN 161 AND 170 THEN '161-170'
    WHEN up.height_cm BETWEEN 171 AND 180 THEN '171-180'
    WHEN up.height_cm BETWEEN 181 AND 190 THEN '181-190'
    ELSE '190+'
  END AS height_range,
  
  -- Search optimization: full text search vector
  to_tsvector('english', 
    COALESCE(up.first_name, '') || ' ' ||
    COALESCE(up.city, '') || ' ' ||
    COALESCE(up.country, '')
  ) AS search_vector

FROM user_profiles up
-- Left join with media for profile pictures (only get the first profile picture)
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (user_id) 
    user_id,
    do_spaces_cdn_url,
    do_spaces_url,
    external_url
  FROM media_references mr
  WHERE mr.user_id = up.user_id 
    AND mr.is_profile_picture = true 
    AND mr.media_type = 'photo'
  ORDER BY user_id, created_at DESC
  LIMIT 1
) mr ON true

-- Only include public profiles with valid data
WHERE up.is_public = true 
  AND up.first_name IS NOT NULL 
  AND up.date_of_birth IS NOT NULL
  AND EXTRACT(YEAR FROM AGE(up.date_of_birth)) BETWEEN 18 AND 80;

-- Create indexes for optimal performance
CREATE UNIQUE INDEX idx_optimized_home_profiles_id ON optimized_home_profiles (id);
CREATE INDEX idx_optimized_home_profiles_user_id ON optimized_home_profiles (user_id);
CREATE INDEX idx_optimized_home_profiles_gender ON optimized_home_profiles (gender);
CREATE INDEX idx_optimized_home_profiles_age ON optimized_home_profiles (age);
CREATE INDEX idx_optimized_home_profiles_age_range ON optimized_home_profiles (age_range);
CREATE INDEX idx_optimized_home_profiles_height_range ON optimized_home_profiles (height_range);
CREATE INDEX idx_optimized_home_profiles_location ON optimized_home_profiles (country, city);
CREATE INDEX idx_optimized_home_profiles_created_at ON optimized_home_profiles (created_at DESC);
CREATE INDEX idx_optimized_home_profiles_search ON optimized_home_profiles USING GIN (search_vector);

-- Create composite indexes for common filter combinations
CREATE INDEX idx_optimized_home_profiles_gender_age ON optimized_home_profiles (gender, age);
CREATE INDEX idx_optimized_home_profiles_gender_location ON optimized_home_profiles (gender, country, city);
CREATE INDEX idx_optimized_home_profiles_gender_physical ON optimized_home_profiles (gender, height_cm, weight_kg);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_optimized_home_profiles()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY optimized_home_profiles;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-refresh on profile changes
CREATE OR REPLACE FUNCTION trigger_refresh_optimized_home_profiles()
RETURNS trigger AS $$
BEGIN
  -- Use pg_notify to trigger background refresh
  PERFORM pg_notify('refresh_home_profiles', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on user_profiles table
DROP TRIGGER IF EXISTS trigger_user_profiles_refresh_home ON user_profiles;
CREATE TRIGGER trigger_user_profiles_refresh_home
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_optimized_home_profiles();

-- Create triggers on media_references table
DROP TRIGGER IF EXISTS trigger_media_refresh_home ON media_references;
CREATE TRIGGER trigger_media_refresh_home
  AFTER INSERT OR UPDATE OR DELETE ON media_references
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_optimized_home_profiles();

-- Initial refresh
SELECT refresh_optimized_home_profiles();

-- Grant permissions
GRANT SELECT ON optimized_home_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_optimized_home_profiles() TO authenticated;
