import type { User } from "@supabase/supabase-js";

export function avatarUrlFromUser(user: User | null): string | null {
  if (!user) return null;
  const m = user.user_metadata as Record<string, unknown>;
  const pick = (k: string) => {
    const v = m[k];
    return typeof v === "string" && v.length > 0 ? v : null;
  };
  return (
    pick("avatar_url") ||
    pick("picture") ||
    pick("image") ||
    pick("profile_image_url_https") ||
    pick("profile_image_url") ||
    null
  );
}
