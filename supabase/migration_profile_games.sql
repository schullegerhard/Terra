-- Run once if you already applied an older schema.sql (additive migration).

alter table public.users add column if not exists game_play_streak integer not null default 0;
alter table public.users add column if not exists last_game_activity_date date;

create table if not exists public.user_game_likes (
  user_id uuid not null references public.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists user_game_likes_user_idx on public.user_game_likes (user_id);

create table if not exists public.user_game_plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  played_at timestamptz not null default now()
);

create index if not exists user_game_plays_user_idx on public.user_game_plays (user_id);
create index if not exists user_game_plays_user_game_idx on public.user_game_plays (user_id, game_id);

alter table public.user_game_likes enable row level security;
alter table public.user_game_plays enable row level security;

drop policy if exists "ugl_select_own" on public.user_game_likes;
create policy "ugl_select_own" on public.user_game_likes
  for select using (auth.uid() = user_id);

drop policy if exists "ugl_insert_own" on public.user_game_likes;
create policy "ugl_insert_own" on public.user_game_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "ugl_delete_own" on public.user_game_likes;
create policy "ugl_delete_own" on public.user_game_likes
  for delete using (auth.uid() = user_id);

drop policy if exists "ugp_select_own" on public.user_game_plays;
create policy "ugp_select_own" on public.user_game_plays
  for select using (auth.uid() = user_id);

create or replace function public.record_game_play(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (timezone('utc', now()))::date;
  yesterday date := today - 1;
  cur_streak int;
  last_act date;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from public.games where id = p_game_id) then
    return jsonb_build_object('ok', false, 'error', 'game_not_found');
  end if;

  insert into public.user_game_plays (user_id, game_id) values (auth.uid(), p_game_id);

  select game_play_streak, last_game_activity_date into cur_streak, last_act
  from public.users where id = auth.uid() for update;

  if last_act = today then
    return jsonb_build_object('ok', true, 'streak', cur_streak);
  elsif last_act = yesterday then
    cur_streak := cur_streak + 1;
  else
    cur_streak := 1;
  end if;

  update public.users
  set
    game_play_streak = cur_streak,
    last_game_activity_date = today
  where id = auth.uid();

  return jsonb_build_object('ok', true, 'streak', cur_streak);
end;
$$;

grant execute on function public.record_game_play(uuid) to authenticated;

-- Better usernames / avatars for Google + X (new signups)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  n int := 0;
begin
  base_username := coalesce(
    nullif(
      trim(lower(coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', ''))),
      ''
    ),
    nullif(trim(split_part(split_part(coalesce(new.email, ''), '@', 1), '+', 1)), ''),
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

  insert into public.users (id, username, email, avatar, referral_code)
  values (
    new.id,
    final_username,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'image',
      new.raw_user_meta_data->>'profile_image_url_https',
      new.raw_user_meta_data->>'profile_image_url'
    ),
    final_username
  );
  return new;
end;
$$;
