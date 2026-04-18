import { GameThumbRow } from "@/components/GameThumbRow";
import { ProfileSection } from "@/components/ProfileSection";
import { XpBar } from "@/components/XpBar";
import { avatarUrlFromUser } from "@/lib/auth-metadata";
import { ensureUserProfileInDb } from "@/lib/ensure-user-profile";
import { fetchGamesByIds, orderGamesByIds } from "@/lib/game-feed";
import { levelFromXp } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";
import { DashboardClaim } from "./dashboard-claim";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ensured = await ensureUserProfileInDb(supabase, user);

  const { data: profileResult } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rank } = await supabase.rpc("get_user_rank", {
    p_user_id: user.id,
  });

  const profile = profileResult;

  if (!profile) {
    return (
      <div className="max-w-lg space-y-4 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70 shadow-sm">
        <p className="font-medium text-black">Could not create your Terra profile</p>
        <p>
          Login works, but inserting your row into{" "}
          <code className="rounded bg-black/5 px-1">public.users</code> was blocked. The app
          needs a one-time <strong>RLS policy</strong> in Supabase so your account can create
          its own row (default stats only).
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-black/80">
          <li>
            Open{" "}
            <code className="rounded bg-black/5 px-1">supabase/migration_users_insert_rls.sql</code>{" "}
            in this project.
          </li>
          <li>
            Copy the whole file → Supabase → <strong>SQL Editor</strong> → paste →{" "}
            <strong>Run</strong>.
          </li>
          <li>
            Refresh this page. No need for the old{" "}
            <code className="rounded bg-black/5 px-1">ensure_user_profile</code> function.
          </li>
        </ol>
        {ensured.error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <p className="font-semibold">Details from Supabase:</p>
            <p className="mt-1 break-all font-mono">{ensured.error}</p>
            <p className="mt-2 text-amber-900">
              If you see “row-level security” or “policy”, the migration above fixes it.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  const { data: plays } = await supabase
    .from("user_game_plays")
    .select("game_id, played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  const playedIds: string[] = [];
  const seenPlay = new Set<string>();
  for (const row of plays ?? []) {
    const gid = row.game_id as string;
    if (!seenPlay.has(gid)) {
      seenPlay.add(gid);
      playedIds.push(gid);
    }
  }

  const { data: likes } = await supabase
    .from("user_game_likes")
    .select("game_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const likedIdsList: string[] = [];
  const seenLike = new Set<string>();
  for (const row of likes ?? []) {
    const gid = row.game_id as string;
    if (!seenLike.has(gid)) {
      seenLike.add(gid);
      likedIdsList.push(gid);
    }
  }

  const likedIds = new Set(likedIdsList);

  const [playedGamesRaw, likedGamesRaw] = await Promise.all([
    fetchGamesByIds(supabase, playedIds),
    fetchGamesByIds(supabase, likedIdsList),
  ]);

  const playedGames = orderGamesByIds(playedIds, playedGamesRaw);
  const likedGames = orderGamesByIds(likedIdsList, likedGamesRaw);

  const level = levelFromXp(profile.xp);
  const avatarUrl = profile.avatar || avatarUrlFromUser(user);
  const playStreak = profile.game_play_streak ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-black/50">
          Dashboard
        </p>
        <p className="mt-1 text-sm text-black/55">
          Your profile, games, and daily rewards in one place.
        </p>
      </div>

      {profile.role === "admin" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/15 bg-black px-4 py-3 text-white shadow-sm">
          <p className="text-sm font-medium">You are signed in as an admin.</p>
          <Link
            href="/admin"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Open admin panel
          </Link>
        </div>
      ) : null}

      <ProfileSection
        username={profile.username}
        email={profile.email}
        avatarUrl={avatarUrl}
        gamesPlayedCount={playedGames.length}
        likedCount={likedGames.length}
        playStreak={playStreak}
        dailyStreak={profile.streak}
        compact
      />

      <GameThumbRow
        title="Games played"
        subtitle="Horizontal cards like Discover — open a game to grow your play streak."
        games={playedGames}
        likedIds={likedIds}
        emptyText="Head to Discover and hit Play now on a title."
      />

      <GameThumbRow
        title="Liked games"
        subtitle="Games you have hearted."
        games={likedGames}
        likedIds={likedIds}
        emptyText="Tap the heart on a game in Discover."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Daily Points" value={profile.dp} accent="DP" />
        <Stat label="XP" value={profile.xp} accent="XP" />
        <Stat
          label="Daily streak"
          value={`${profile.streak} day${profile.streak === 1 ? "" : "s"}`}
          accent="🔥"
        />
        <Stat
          label="Referrals"
          value={profile.referral_count}
          accent="friends"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-black/10 p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-black/60">Level</p>
              <p className="text-2xl font-semibold">{level}</p>
            </div>
            <div className="text-right text-sm text-black/60">
              Leaderboard rank
              <p className="text-lg font-semibold text-black">
                {rank != null ? `#${rank}` : "—"}
              </p>
            </div>
          </div>
          <XpBar xp={profile.xp} />
        </div>

        <DashboardClaim lastClaimAt={profile.last_claim_at} />
      </div>

      <ReferralCard username={profile.username} referralCode={profile.referral_code} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:border-black/20">
      <p className="text-xs font-medium uppercase tracking-wide text-black/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-black/40">{accent}</p>
    </div>
  );
}

function ReferralCard({
  username,
  referralCode,
}: {
  username: string;
  referralCode: string;
}) {
  const base =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "";
  const link =
    base.length > 0
      ? `${base.replace(/\/$/, "")}/signup?ref=${encodeURIComponent(referralCode)}`
      : `/signup?ref=${encodeURIComponent(referralCode)}`;

  return (
    <div className="rounded-2xl border border-dashed border-black/20 bg-black/[0.02] p-5">
      <p className="text-sm font-medium">Your referral link</p>
      <p className="mt-1 text-xs text-black/55">
        Earn +50 DP and +20 XP when a friend joins. Self-referrals blocked.
      </p>
      <p className="mt-3 break-all font-mono text-sm">{link}</p>
      <p className="mt-2 text-xs text-black/45">
        Share as <span className="font-medium text-black">{username}</span> or code{" "}
        <span className="font-medium text-black">{referralCode}</span>
      </p>
    </div>
  );
}
