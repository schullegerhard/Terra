-- Optional RPC fallback (reads auth.users). Most setups should use instead:
--   supabase/migration_users_insert_rls.sql
-- which lets the Next.js app insert public.users using the session (recommended).
--
-- Run in Supabase SQL Editor if you still want this function.

create or replace function public.ensure_user_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  auth_email text;
  auth_meta jsonb;
  base_username text;
  final_username text;
  n int := 0;
  av text;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if exists (select 1 from public.users where id = uid) then
    return jsonb_build_object('ok', true, 'created', false);
  end if;

  select u.email, u.raw_user_meta_data into auth_email, auth_meta
  from auth.users u
  where u.id = uid;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'auth_user_missing');
  end if;

  base_username := coalesce(
    nullif(
      trim(lower(coalesce(auth_meta->>'user_name', auth_meta->>'preferred_username', ''))),
      ''
    ),
    nullif(trim(split_part(split_part(coalesce(auth_email, ''), '@', 1), '+', 1)), ''),
    'user'
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'user';
  end if;
  final_username := base_username;
  while exists (select 1 from public.users where username = final_username) loop
    n := n + 1;
    final_username := base_username || n::text;
  end loop;

  av := coalesce(
    auth_meta->>'avatar_url',
    auth_meta->>'picture',
    auth_meta->>'image',
    auth_meta->>'profile_image_url_https',
    auth_meta->>'profile_image_url'
  );

  insert into public.users (id, username, email, avatar, referral_code)
  values (uid, final_username, auth_email, av, final_username);

  return jsonb_build_object('ok', true, 'created', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true, 'created', false);
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;
