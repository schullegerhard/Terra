import { GameThumbRow } from "@/components/GameThumbRow";
import { ProfileSection } from "@/components/ProfileSection";
import { avatarUrlFromUser } from "@/lib/auth-metadata";
import { ensureUserProfileInDb } from "@/lib/ensure-user-profile";
import { fetchGamesByIds, orderGamesByIds } from "@/lib/game-feed";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ensured = await ensureUserProfileInDb(supabase, user);

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="max-w-lg space-y-3 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70 shadow-sm">
        <p className="font-medium text-black">Could not load profile</p>
        <p>
          Run{" "}
          <code className="rounded bg-black/5 px-1">supabase/migration_users_insert_rls.sql</code>{" "}
          in Supabase SQL Editor, then refresh.
        </p>
        {ensured.error ? (
          <p className="break-all rounded-lg bg-amber-50 p-2 font-mono text-xs text-amber-950">
            {ensured.error}
          </p>
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

  const avatarUrl = profile.avatar || avatarUrlFromUser(user);
  const playStreak = profile.game_play_streak ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-black/55">
          Avatar comes from Google or X after OAuth. We sync it to your Terra profile on each
          visit.
        </p>
      </div>

      <ProfileSection
        username={profile.username}
        email={profile.email}
        avatarUrl={avatarUrl}
        gamesPlayedCount={playedGames.length}
        likedCount={likedGames.length}
        playStreak={playStreak}
        dailyStreak={profile.streak}
      />

      <GameThumbRow
        title="Games played"
        subtitle="Rounded 16:9 cards — same style as Discover."
        games={playedGames}
        likedIds={likedIds}
        emptyText="Nothing played yet. Visit Discover."
      />

      <GameThumbRow
        title="Liked games"
        games={likedGames}
        likedIds={likedIds}
        emptyText="Like games from Discover to see them here."
      />
    </div>
  );
}