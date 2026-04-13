import { GameThumbRow } from "@/components/GameThumbRow";
import { fetchGamesByIds, orderGamesByIds } from "@/lib/game-feed";
import { createClient } from "@/lib/supabase/server";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

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

  const allGames = games ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discover games</h1>
        <p className="mt-1 text-sm text-black/55">
          Scroll sideways — new admin listings show up here automatically in the same card
          layout.
        </p>
      </div>

      <GameThumbRow
        title="Games played"
        subtitle="Pick up where you left off."
        games={playedGames}
        likedIds={likedIds}
        emptyText="Play a title below to fill this row."
      />

      <GameThumbRow
        title="Liked games"
        subtitle="Your saved picks."
        games={likedGames}
        likedIds={likedIds}
        emptyText="Heart games you want to revisit."
      />

      <GameThumbRow
        title="Discover games"
        subtitle="Partner titles curated for Terra."
        games={allGames}
        likedIds={likedIds}
        emptyText="Games will appear here when added in Admin."
      />
    </div>
  );
}
