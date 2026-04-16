"use client";

import { createClient } from "@/lib/supabase/client";
import type { GameRow, TaskRow } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  dp: number;
  xp: number;
  referral_count: number;
  created_at: string;
  role: string;
};

type Tab = "tasks" | "games" | "users";

export function AdminPanel({
  initialTasks,
  initialGames,
  initialUsers,
}: {
  initialTasks: TaskRow[];
  initialGames: GameRow[];
  initialUsers: UserRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tasks");

  const tabs = useMemo(
    () =>
      [
        { id: "tasks" as const, label: "Tasks" },
        { id: "games" as const, label: "Games" },
        { id: "users" as const, label: "Users" },
      ] as const,
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-black text-white"
                : "bg-black/5 text-black/70 hover:bg-black/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" ? (
        <TasksAdmin initial={initialTasks} onChanged={() => router.refresh()} />
      ) : null}
      {tab === "games" ? (
        <GamesAdmin initial={initialGames} onChanged={() => router.refresh()} />
      ) : null}
      {tab === "users" ? <UsersTable users={initialUsers} /> : null}
    </div>
  );
}

function TasksAdmin({
  initial,
  onChanged,
}: {
  initial: TaskRow[];
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "twitter",
    reward_dp: 10,
    reward_xp: 5,
    link: "",
    is_daily: true,
  });

  const createTask = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setBusy("create");
    const { error } = await supabase.from("tasks").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      reward_dp: form.reward_dp,
      reward_xp: form.reward_xp,
      link: form.link.trim() || null,
      is_active: true,
      is_daily: form.is_daily,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task created");
    onChanged();
    setForm({
      title: "",
      description: "",
      type: "twitter",
      reward_dp: 10,
      reward_xp: 5,
      link: "",
      is_daily: true,
    });
  };

  const toggle = async (id: string, is_active: boolean) => {
    setBusy(id);
    const { error } = await supabase.from("tasks").update({ is_active }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(is_active ? "Task activated" : "Task deactivated");
    onChanged();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">Create task</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-black/55">Title</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="text-black/55">Type</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-black/55">Description</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-black/55">Reward DP</span>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.reward_dp}
              onChange={(e) =>
                setForm((f) => ({ ...f, reward_dp: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-black/55">Reward XP</span>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.reward_xp}
              onChange={(e) =>
                setForm((f) => ({ ...f, reward_xp: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-black/55">Link (optional)</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_daily}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_daily: e.target.checked }))
              }
            />
            Daily reset (unchecked = one-time)
          </label>
        </div>
        <button
          type="button"
          disabled={busy === "create"}
          onClick={() => void createTask()}
          className="mt-4 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy === "create" ? "Saving…" : "Create task"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/50">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Rewards</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((t) => (
              <tr key={t.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-black/45">{t.type}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-black/70">
                  {t.reward_dp} DP · {t.reward_xp} XP
                </td>
                <td className="px-4 py-3 text-xs text-black/60">
                  {t.is_daily ? "Daily" : "One-time"} ·{" "}
                  {t.is_active ? "Active" : "Inactive"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busy === t.id}
                    onClick={() => void toggle(t.id, !t.is_active)}
                    className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10"
                  >
                    {t.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GamesAdmin({
  initial,
  onChanged,
}: {
  initial: GameRow[];
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    link: "",
    category: "",
    featured: false,
  });

  const createGame = async () => {
    if (!form.name.trim() || !form.link.trim()) {
      toast.error("Name and link are required.");
      return;
    }
    setBusy("create");
    const { error } = await supabase.from("games").insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      image: form.image.trim() || null,
      link: form.link.trim(),
      category: form.category.trim() || null,
      featured: form.featured,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Game added");
    onChanged();
    setForm({
      name: "",
      description: "",
      image: "",
      link: "",
      category: "",
      featured: false,
    });
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    setBusy(id);
    const { error } = await supabase.from("games").update({ featured }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(featured ? "Featured" : "Unfeatured");
    onChanged();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">Add game</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-black/55">Name</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="text-black/55">Category</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-black/55">Description</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-black/55">Thumbnail URL</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-black/55">Play link</span>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm((f) => ({ ...f, featured: e.target.checked }))
              }
            />
            Featured
          </label>
        </div>
        <button
          type="button"
          disabled={busy === "create"}
          onClick={() => void createGame()}
          className="mt-4 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy === "create" ? "Saving…" : "Add game"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/50">
            <tr>
              <th className="px-4 py-3 font-medium">Game</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium text-right">Feature</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((g) => (
              <tr key={g.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{g.name}</p>
                  {g.category ? (
                    <p className="text-xs text-black/45">{g.category}</p>
                  ) : null}
                </td>
                <td className="max-w-[240px] truncate px-4 py-3 text-xs text-black/55">
                  {g.link}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busy === g.id}
                    onClick={() => void toggleFeatured(g.id, !g.featured)}
                    className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10"
                  >
                    {g.featured ? "Unfeature" : "Feature"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/50">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">DP</th>
            <th className="px-4 py-3 font-medium">XP</th>
            <th className="px-4 py-3 font-medium">Referrals</th>
            <th className="px-4 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium">{u.username}</td>
              <td className="px-4 py-3 text-black/60">{u.email ?? "—"}</td>
              <td className="px-4 py-3 tabular-nums">{u.dp}</td>
              <td className="px-4 py-3 tabular-nums">{u.xp}</td>
              <td className="px-4 py-3 tabular-nums">{u.referral_count}</td>
              <td className="px-4 py-3 text-xs uppercase text-black/60">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
