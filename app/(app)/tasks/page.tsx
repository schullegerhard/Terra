import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const { data: completions } = await supabase
    .from("user_tasks")
    .select("task_id, completed_at")
    .eq("user_id", user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daily tasks</h1>
        <p className="mt-1 text-sm text-black/55">
          Complete social and partner tasks. Verify when you are done.
        </p>
      </div>
      <TasksClient tasks={tasks ?? []} completions={completions ?? []} />
    </div>
  );
}
