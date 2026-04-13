import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameRow } from "@/lib/types";

export async function fetchGamesByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<GameRow[]> {
  if (!ids.length) return [];
  const { data } = await supabase.from("games").select("*").in("id", ids);
  return (data as GameRow[]) ?? [];
}

export function orderGamesByIds(ids: string[], games: GameRow[]): GameRow[] {
  const map = new Map(games.map((g) => [g.id, g]));
  return ids.map((id) => map.get(id)).filter(Boolean) as GameRow[];
}
