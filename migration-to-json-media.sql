-- NOT RECOMMENDED - Just showing how it would work

-- Add media column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN media_items JSONB DEFAULT '{"photos": [], "videos": []}'::jsonb;

-- Migrate existing data
UPDATE user_profiles up
SET media_items = (
  SELECT jsonb_build_object(
    'photos', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', mr.id,
          'external_url', mr.external_url,
          'thumbnail_url', mr.thumbnail_url,
          'is_profile_picture', mr.is_profile_picture,
          'visibility_level', mr.visibility_level,
          'upload_date', mr.upload_date,
          'file_size_bytes', mr.file_size_bytes,
          'mime_type', mr.mime_type,
          'do_spaces_key', mr.do_spaces_key,
          'do_spaces_url', mr.do_spaces_url,
          'do_spaces_cdn_url', mr.do_spaces_cdn_url
        ) ORDER BY mr.media_order
      ) FILTER (WHERE mr.media_type = 'photo'), 
      '[]'::jsonb
    ),
    'videos', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', mr.id,
          'external_url', mr.external_url,
          'thumbnail_url', mr.thumbnail_url,
          'visibility_level', mr.visibility_level,
          'upload_date', mr.upload_date,
          'file_size_bytes', mr.file_size_bytes,
          'mime_type', mr.mime_type,
          'do_spaces_key', mr.do_spaces_key,
          'do_spaces_url', mr.do_spaces_url,
          'do_spaces_cdn_url', mr.do_spaces_cdn_url
        ) ORDER BY mr.media_order
      ) FILTER (WHERE mr.media_type = 'video'), 
      '[]'::jsonb
    )
  )
  FROM media_references mr
  WHERE mr.user_id = up.user_id
);

-- Example queries with JSON (much more complex!)

-- Get all photos for a user
SELECT media_items->'photos' as photos 
FROM user_profiles 
WHERE user_id = '...';

-- Add a new photo (requires reading, modifying, writing entire JSON)
UPDATE user_profiles 
SET media_items = jsonb_set(
  media_items,
  '{photos}',
  media_items->'photos' || jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid(),
    'external_url', 'https://...',
    'upload_date', NOW()
    -- etc...
  ))
)
WHERE user_id = '...';

-- Find users with profile pictures (very slow!)
SELECT * FROM user_profiles
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(media_items->'photos') AS photo
  WHERE (photo->>'is_profile_picture')::boolean = true
);
