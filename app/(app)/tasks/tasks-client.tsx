"use client";

import { createClient } from "@/lib/supabase/client";
import type { TaskRow } from "@/lib/types";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Completion = { task_id: string; completed_at: string };

function utcDay(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function TasksClient({
  tasks,
  completions,
}: {
  tasks: TaskRow[];
  completions: Completion[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const completionMap = useMemo(() => {
    const map = new Map<string, Completion[]>();
    for (const c of completions) {
      const list = map.get(c.task_id) ?? [];
      list.push(c);
      map.set(c.task_id, list);
    }
    return map;
  }, [completions]);

  const isDone = (t: TaskRow) => {
    const list = completionMap.get(t.id) ?? [];
    if (t.is_daily) {
      return list.some((c) => utcDay(c.completed_at) === todayUtc());
    }
    return list.length > 0;
  };

  const fire = () => {
    void confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#111111", "#444444"],
    });
  };

  const verify = async (taskId: string) => {
    setBusy(taskId);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("complete_task", {
      p_task_id: taskId,
    });
    setBusy(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    const result = data as { ok?: boolean; error?: string; rewardDp?: number; rewardXp?: number };
    if (!result?.ok) {
      if (result?.error === "already_completed" || result?.error === "already_completed_today") {
        toast.message("Already completed.");
      } else {
        toast.error("Could not complete task.");
      }
      router.refresh();
      return;
    }

    fire();
    toast.success(`+${result.rewardDp} DP · +${result.rewardXp} XP`);
    router.refresh();
  };

  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">
        No active tasks yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {tasks.map((t) => {
        const done = isDone(t);
        return (
          <li
            key={t.id}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:border-black/20"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{t.title}</h2>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-black/60">
                    {t.type}
                  </span>
                  {t.is_daily ? (
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white">
                      Daily
                    </span>
                  ) : (
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-black/70">
                      One-time
                    </span>
                  )}
                </div>
                {t.description ? (
                  <p className="text-sm text-black/60">{t.description}</p>
                ) : null}
                <p className="text-sm text-black">
                  <span className="font-medium">+{t.reward_dp} DP</span>
                  <span className="text-black/40"> · </span>
                  <span className="font-medium">+{t.reward_xp} XP</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {t.link ? (
                  <a
                    href={t.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-black/5 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/10"
                  >
                    Open link
                  </a>
                ) : null}
                <button
                  type="button"
                  disabled={done || busy === t.id}
                  onClick={() => void verify(t.id)}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/20"
                >
                  {done ? "Completed" : busy === t.id ? "Verifying…" : "Verify"}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
