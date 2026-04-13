import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "./admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: games }, { data: users }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("games").select("*").order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, username, email, dp, xp, referral_count, created_at, role")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-black/55">
          Manage tasks, games, and review community stats.
        </p>
      </div>
      <AdminPanel
        initialTasks={tasks ?? []}
        initialGames={games ?? []}
        initialUsers={users ?? []}
      />
    </div>
  );
}
