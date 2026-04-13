import type { GameRow } from "@/lib/types";
import { GameThumbCard } from "@/components/GameThumbCard";

export function GameThumbRow({
  title,
  subtitle,
  games,
  emptyText,
  likedIds,
}: {
  title: string;
  subtitle?: string;
  games: GameRow[];
  emptyText?: string;
  likedIds: Set<string>;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-black/55">{subtitle}</p>
        ) : null}
      </div>
      {!games.length ? (
        <p className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-8 text-center text-sm text-black/50">
          {emptyText ?? "Nothing here yet."}
        </p>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:thin]">
          {games.map((g) => (
            <GameThumbCard key={g.id} game={g} initiallyLiked={likedIds.has(g.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
