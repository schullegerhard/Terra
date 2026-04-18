import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function normalizeNext(next: string | null): string {
  const n = next?.trim() || "/dashboard";
  return n.startsWith("/") ? n : "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = normalizeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session?.user) {
      let dest = next;
      const defaultHome = next === "/dashboard";
      if (defaultHome) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.session.user.id)
          .maybeSingle();
        if (profile?.role === "admin") {
          dest = "/admin";
        }
      }
      console.log(`[Auth Callback] Success! Redirecting to: ${origin}${dest}`);
      return NextResponse.redirect(`${origin}${dest}`);
    } else {
      console.log("[Auth Callback] Error during token exchange:", error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
