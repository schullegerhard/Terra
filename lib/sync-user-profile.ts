import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { avatarUrlFromUser } from "@/lib/auth-metadata";

export async function syncUserAvatarFromAuth(
  supabase: SupabaseClient,
  user: User
) {
  const avatar = avatarUrlFromUser(user);
  if (!avatar) return;

  const { data: row } = await supabase
    .from("users")
    .select("avatar")
    .eq("id", user.id)
    .maybeSingle();

  if (row?.avatar === avatar) return;

  await supabase.from("users").update({ avatar }).eq("id", user.id);
}
