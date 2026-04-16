import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { avatarUrlFromUser } from "@/lib/auth-metadata";

function usernameBaseFromUser(user: User): string {
  const m = user.user_metadata as Record<string, unknown>;
  const tw =
    (typeof m.user_name === "string" ? m.user_name : "") ||
    (typeof m.preferred_username === "string" ? m.preferred_username : "");
  const fromMeta = tw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const rawEmail = user.email ?? "";
  const local =
    rawEmail.split("@")[0]?.split("+")[0]?.trim().toLowerCase() ?? "";
  const fromEmail = local.replace(/[^a-z0-9_]/g, "");
  let base = fromMeta || fromEmail || "user";
  if (base.length < 3) base = "user";
  return base;
}

async function userRowExists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.id;
}

/**
 * Ensures a public.users row exists using the JWT session (no auth.users read in Postgres).
 * Requires Supabase policy "users_insert_own" — see supabase/migration_users_insert_rls.sql
 */
export async function ensureUserProfileInDb(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: boolean; error: string | null }> {
  if (await userRowExists(supabase, user.id)) {
    return { ok: true, error: null };
  }

  const base = usernameBaseFromUser(user);
  const avatar = avatarUrlFromUser(user);

  const tryInsert = async (uname: string) => {
    return supabase.from("users").insert({
      id: user.id,
      username: uname,
      email: user.email ?? null,
      avatar,
      referral_code: uname,
    });
  };

  for (let n = 0; n < 500; n++) {
    const uname = n === 0 ? base : `${base}${n}`;
    const { error } = await tryInsert(uname);

    if (!error) {
      return { ok: true, error: null };
    }

    const code = (error as { code?: string }).code;
    if (code === "23505") {
      if (await userRowExists(supabase, user.id)) {
        return { ok: true, error: null };
      }
      continue;
    }

    return { ok: false, error: error.message };
  }

  for (let k = 0; k < 24; k++) {
    const suffix = randomBytes(4).toString("hex");
    const uname = `${base}_${suffix}`;
    const { error } = await tryInsert(uname);

    if (!error) {
      return { ok: true, error: null };
    }

    const code = (error as { code?: string }).code;
    if (code === "23505") {
      if (await userRowExists(supabase, user.id)) {
        return { ok: true, error: null };
      }
      continue;
    }

    return { ok: false, error: error.message };
  }

  return {
    ok: false,
    error:
      "Could not create your profile (username space full or database error). Contact support.",
  };
}
