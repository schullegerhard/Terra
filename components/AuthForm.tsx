"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const REF_KEY = "terra_ref";

export function AuthForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem(REF_KEY, ref.trim());
    }
  }, [searchParams]);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const signIn = async (provider: "google" | "twitter" | "x") => {
    setLoading(provider);
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(null);
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <button
        type="button"
        disabled={!!loading}
        onClick={() => void signIn("google")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/15 bg-white py-3 text-sm font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-md active:translate-y-0 disabled:opacity-60"
      >
        {loading === "google" ? "Connecting…" : "Continue with Google"}
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() => void signIn("x")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black/90 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
      >
        {loading === "x" ? "Connecting…" : "Continue with X"}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-black/45">
        If X shows{" "}
        <span className="font-mono text-[10px]">Unsupported provider</span>, open Supabase →
        Authentication → Providers and enable <strong>Twitter</strong> (the API provider id is{" "}
        <span className="font-mono">twitter</span>
        ). Add redirect URL <span className="font-mono">http://localhost:3000/auth/callback</span>{" "}
        (and your production URL).
      </p>
      <p className="text-center text-xs text-black/45">
        By continuing you agree to Terra community guidelines.
      </p>
    </div>
  );
}
