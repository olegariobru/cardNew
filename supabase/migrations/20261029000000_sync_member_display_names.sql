-- Keep the Auth Users dashboard display name aligned with the member profile.
-- This metadata is for display only; authorization continues to use app_metadata/RLS.
UPDATE auth.users AS auth_user
SET raw_user_meta_data = COALESCE(auth_user.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'name', member.name,
    'full_name', member.name,
    'display_name', member.name
  ),
  updated_at = NOW()
FROM public.member_profiles AS member
WHERE auth_user.id = member.id
  AND (
    auth_user.raw_user_meta_data ->> 'name' IS DISTINCT FROM member.name
    OR auth_user.raw_user_meta_data ->> 'full_name' IS DISTINCT FROM member.name
    OR auth_user.raw_user_meta_data ->> 'display_name' IS DISTINCT FROM member.name
  );
