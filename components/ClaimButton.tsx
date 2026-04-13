"use client";

import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function utcToday(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function msUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return Math.max(0, next.getTime() - now.getTime());
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

type Props = {
  lastClaimAt: string | null;
  onClaimed: () => void;
};

export function ClaimButton({ lastClaimAt, onClaimed }: Props) {
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const claimedToday = useMemo(() => {
    if (!lastClaimAt) return false;
    const last = new Date(lastClaimAt).toISOString().slice(0, 10);
    return last === utcToday();
  }, [lastClaimAt, tick]);

  useEffect(() => {
    if (claimedToday) {
      const id = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(id);
    }
  }, [claimedToday]);

  const countdown = useMemo(() => {
    if (!claimedToday) return null;
    return formatMs(msUntilNextUtcMidnight());
  }, [claimedToday, tick]);

  const fireConfetti = useCallback(() => {
    void confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["#000000", "#333333", "#666666"],
    });
  }, []);

  const handleClaim = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("claim_daily");
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const result = data as {
      ok?: boolean;
      error?: string;
      dp?: number;
      streak?: number;
      bonusDp?: number;
    };

    if (!result?.ok) {
      if (result?.error === "already_claimed") {
        toast.message("Already claimed today.");
      } else {
        toast.error("Could not claim.");
      }
      return;
    }

    fireConfetti();
    toast.success(
      `+${result.dp} DP · Streak ${result.streak} day${result.streak === 1 ? "" : "s"}`
    );
    onClaimed();
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-black">Daily reward</p>
          <p className="text-xs text-black/55">
            Base 10 DP · Streak bonuses 2–5d +5 · 6–10d +10 · 10+ +20
          </p>
        </div>
      </div>
      {claimedToday ? (
        <div className="space-y-2">
          <p className="text-sm text-black/70">
            Next claim in <span className="font-mono font-medium">{countdown}</span>{" "}
            (UTC day)
          </p>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-black/10 py-3 text-sm font-semibold text-black/40"
          >
            Come back tomorrow
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleClaim()}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white shadow-md transition hover:bg-black/90 hover:shadow-lg active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Claiming…" : "Claim daily reward"}
        </button>
      )}
    </div>
  );
}
