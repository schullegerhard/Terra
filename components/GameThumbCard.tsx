"use client";

import { createClient } from "@/lib/supabase/client";
import type { GameRow } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function GameThumbCard({
  game,
  initiallyLiked,
}: {
  game: GameRow;
  initiallyLiked: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initiallyLiked);
  const [busy, setBusy] = useState<"like" | "play" | null>(null);

  const toggleLike = async () => {
    setBusy("like");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(null);
      return;
    }

    if (liked) {
      const { error } = await supabase
        .from("user_game_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", game.id);
      setBusy(null);
      if (error) {
        toast.error(error.message);
        return;
      }
      setLiked(false);
      toast.message("Removed from likes");
    } else {
      const { error } = await supabase.from("user_game_likes").insert({
        user_id: user.id,
        game_id: game.id,
      });
      setBusy(null);
      if (error) {
        toast.error(error.message);
        return;
      }
      setLiked(true);
      toast.success("Saved to likes");
    }
    router.refresh();
  };

  const play = async () => {
    setBusy("play");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("record_game_play", {
      p_game_id: game.id,
    });
    setBusy(null);

    if (error) {
      toast.error(error.message);
    } else {
      const r = data as { ok?: boolean; streak?: number };
      if (r?.ok && typeof r.streak === "number") {
        toast.message(`Play streak: ${r.streak} day${r.streak === 1 ? "" : "s"}`);
      }
      router.refresh();
    }

    window.open(game.link, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="relative w-[min(72vw,260px)] shrink-0 overflow-hidden rounded-3xl border border-black/10 bg-black shadow-md ring-1 ring-black/5">
      <div className="relative aspect-video w-full bg-black/20">
        {game.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-800 to-black text-xs text-white/50">
            {game.name}
          </div>
        )}
        {game.featured ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            Featured
          </span>
        ) : null}
        <button
          type="button"
          aria-label={liked ? "Unlike" : "Like"}
          disabled={busy === "like"}
          onClick={() => void toggleLike()}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg text-white backdrop-blur transition hover:bg-black/55"
        >
          {liked ? "♥" : "♡"}
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 pt-10">
          <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
            {game.name}
          </p>
          <button
            type="button"
            disabled={busy === "play"}
            onClick={() => void play()}
            className="mt-2 w-full rounded-xl bg-white py-2 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy === "play" ? "Opening…" : "Play now"}
          </button>
        </div>
      </div>
    </article>
  );
}
