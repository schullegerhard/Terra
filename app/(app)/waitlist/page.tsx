import { createClient } from "@/lib/supabase/server";
import { WaitlistClient } from "./waitlist-client";

export default async function WaitlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("waitlist")
    .select("id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">OG card waitlist</h1>
        <p className="mt-1 text-sm text-black/55">
          Reserve your spot for the Terra OG card drop.
        </p>
      </div>

      <WaitlistClient joined={!!existing} joinedAt={existing?.created_at ?? null} />
    </div>
  );
}
