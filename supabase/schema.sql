-- Terra v1.5 — Run in Supabase SQL Editor (or migrations)
-- Enable extensions if needed
-- create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- public.users (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text,
  avatar text,
  dp integer not null default 0,
  xp integer not null default 0,
  streak integer not null default 0,
  last_claim_at timestamptz,
  referral_code text not null unique,
  referred_by uuid references public.users (id),
  referral_count integer not null default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  game_play_streak integer not null default 0,
  last_game_activity_date date,
  created_at timestamptz not null default now()
);

create index if not exists users_xp_idx on public.users (xp desc);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'manual',
  reward_dp integer not null default 0,
  reward_xp integer not null default 0,
  link text,
  is_active boolean not null default true,
  is_daily boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_tasks (one row per completion; daily tasks may have many rows)
-- ---------------------------------------------------------------------------
create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  completed_at timestamptz not null default now()
);

create index if not exists user_tasks_user_task_idx on public.user_tasks (user_id, task_id);
create index if not exists user_tasks_completed_idx on public.user_tasks (user_id, task_id, completed_at);

-- ---------------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image text,
  link text not null,
  category text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- game engagement (likes + plays / streak)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- waitlist
-- ---------------------------------------------------------------------------
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auth: new user profile
-- ---------------------------------------------------------------------------
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;
alter table public.games enable row level security;
alter table public.waitlist enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- One-time self row (defaults only) when signup trigger did not run
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert
  with check (
    auth.uid() = id
    and coalesce(dp, 0) = 0
    and coalesce(xp, 0) = 0
    and coalesce(streak, 0) = 0
    and coalesce(referral_count, 0) = 0
    and coalesce(game_play_streak, 0) = 0
    and role = 'user'
    and referred_by is null
    and last_claim_at is null
    and last_game_activity_date is null
  );

drop policy if exists "tasks_read_active" on public.tasks;
create policy "tasks_read_active" on public.tasks
  for select using (is_active = true or exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

drop policy if exists "tasks_admin_all" on public.tasks;
create policy "tasks_admin_all" on public.tasks
  for all using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

drop policy if exists "user_tasks_own" on public.user_tasks;
create policy "user_tasks_own" on public.user_tasks
  for select using (auth.uid() = user_id);

drop policy if exists "user_tasks_insert_own" on public.user_tasks;
create policy "user_tasks_insert_own" on public.user_tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "games_read" on public.games;
create policy "games_read" on public.games
  for select using (true);

drop policy if exists "games_admin" on public.games;
create policy "games_admin" on public.games
  for all using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

drop policy if exists "waitlist_select" on public.waitlist;
create policy "waitlist_select" on public.waitlist
  for select using (auth.uid() = user_id);

drop policy if exists "waitlist_insert" on public.waitlist;
create policy "waitlist_insert" on public.waitlist
  for insert with check (auth.uid() = user_id);

drop policy if exists "users_admin_select" on public.users;
create policy "users_admin_select" on public.users
  for select using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
  ));

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

-- ---------------------------------------------------------------------------
-- RPC: daily claim (UTC calendar day, streak rules)
-- ---------------------------------------------------------------------------
create or replace function public.claim_daily()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.users%rowtype;
  today date := (timezone('utc', now()))::date;
  last_date date;
  yesterday date := today - 1;
  new_streak int;
  streak_bonus int := 0;
  total_dp int := 10;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into u from public.users where id = auth.uid() for update;
  if not found then
    raise exception 'user_not_found';
  end if;

  if u.last_claim_at is not null then
    last_date := (timezone('utc', u.last_claim_at))::date;
  else
    last_date := null;
  end if;

  if last_date = today then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  if u.last_claim_at is null or last_date < yesterday then
    new_streak := 1;
  elsif last_date = yesterday then
    new_streak := u.streak + 1;
  else
    new_streak := 1;
  end if;

  if new_streak >= 2 and new_streak <= 5 then
    streak_bonus := 5;
  elsif new_streak >= 6 and new_streak <= 10 then
    streak_bonus := 10;
  elsif new_streak > 10 then
    streak_bonus := 20;
  end if;

  total_dp := 10 + streak_bonus;

  update public.users
  set
    streak = new_streak,
    last_claim_at = now(),
    dp = dp + total_dp
  where id = auth.uid();

  return jsonb_build_object(
    'ok', true,
    'dp', total_dp,
    'baseDp', 10,
    'bonusDp', streak_bonus,
    'streak', new_streak
  );
end;
$$;

grant execute on function public.claim_daily() to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: complete task
-- ---------------------------------------------------------------------------
create or replace function public.complete_task(p_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tasks%rowtype;
  today date := (timezone('utc', now()))::date;
  done_today boolean;
  done_ever boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into t from public.tasks where id = p_task_id for update;
  if not found or t.is_active = false then
    return jsonb_build_object('ok', false, 'error', 'task_not_found');
  end if;

  if t.is_daily then
    select exists (
      select 1 from public.user_tasks ut
      where ut.user_id = auth.uid()
        and ut.task_id = p_task_id
        and (timezone('utc', ut.completed_at))::date = today
    ) into done_today;
    if done_today then
      return jsonb_build_object('ok', false, 'error', 'already_completed_today');
    end if;
  else
    select exists (
      select 1 from public.user_tasks ut
      where ut.user_id = auth.uid() and ut.task_id = p_task_id
    ) into done_ever;
    if done_ever then
      return jsonb_build_object('ok', false, 'error', 'already_completed');
    end if;
  end if;

  insert into public.user_tasks (user_id, task_id) values (auth.uid(), p_task_id);

  update public.users
  set
    dp = dp + t.reward_dp,
    xp = xp + t.reward_xp
  where id = auth.uid();

  return jsonb_build_object(
    'ok', true,
    'rewardDp', t.reward_dp,
    'rewardXp', t.reward_xp
  );
end;
$$;

grant execute on function public.complete_task(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: apply referral (once)
-- ---------------------------------------------------------------------------
create or replace function public.apply_referral(p_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.users%rowtype;
  ref_user public.users%rowtype;
  ref_norm text := lower(trim(p_ref));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into me from public.users where id = auth.uid() for update;
  if me.referred_by is not null then
    return jsonb_build_object('ok', false, 'error', 'already_referred');
  end if;

  if ref_norm is null or ref_norm = '' then
    return jsonb_build_object('ok', false, 'error', 'invalid_ref');
  end if;

  if lower(me.username) = ref_norm or lower(me.referral_code) = ref_norm then
    return jsonb_build_object('ok', false, 'error', 'self_referral');
  end if;

  select * into ref_user from public.users
  where lower(username) = ref_norm or lower(referral_code) = ref_norm
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'referrer_not_found');
  end if;

  if ref_user.id = me.id then
    return jsonb_build_object('ok', false, 'error', 'self_referral');
  end if;

  update public.users
  set referred_by = ref_user.id
  where id = me.id;

  update public.users
  set
    referral_count = referral_count + 1,
    dp = dp + 50,
    xp = xp + 20
  where id = ref_user.id;

  return jsonb_build_object('ok', true, 'referrerId', ref_user.id);
end;
$$;

grant execute on function public.apply_referral(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard (safe columns only)
-- ---------------------------------------------------------------------------
create or replace function public.get_leaderboard(p_limit int default 50)
returns table (
  rank bigint,
  user_id uuid,
  username text,
  avatar text,
  xp int
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by u.xp desc, u.created_at asc)::bigint,
    u.id,
    u.username,
    u.avatar,
    u.xp
  from public.users u
  order by u.xp desc, u.created_at asc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.get_leaderboard(int) to authenticated, anon;

create or replace function public.get_user_rank(p_user_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  select s.rank from (
    select
      u.id,
      row_number() over (order by u.xp desc, u.created_at asc)::bigint as rank
    from public.users u
  ) s
  where s.id = p_user_id;
$$;

grant execute on function public.get_user_rank(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- RPC: record game play (log + daily play streak)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RPC: backfill public.users if trigger missed (existing auth users)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Seed example tasks / games (optional)
-- ---------------------------------------------------------------------------
-- insert into public.tasks (title, description, type, reward_dp, reward_xp, link, is_daily) values
-- ('Post about Terra on X', 'Share Terra with your followers', 'twitter', 25, 15, 'https://x.com', true);
