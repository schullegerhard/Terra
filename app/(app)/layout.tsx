import { AppNav } from "@/components/AppNav";
import { ReferralHandler } from "@/components/ReferralHandler";
import { ensureUserProfileInDb } from "@/lib/ensure-user-profile";
import { syncUserAvatarFromAuth } from "@/lib/sync-user-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureUserProfileInDb(supabase, user);
  await syncUserAvatarFromAuth(supabase, user);

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-full flex-col bg-white text-black">
      <AppNav isAdmin={profile?.role === "admin"} />
      <ReferralHandler />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
