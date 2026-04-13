-- REQUIRED if profile/dashboard stays empty after login.
-- Adds game columns if your DB predates them, then allows self-insert into public.users.

alter table public.users add column if not exists game_play_streak integer not null default 0;
alter table public.users add column if not exists last_game_activity_date date;

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
