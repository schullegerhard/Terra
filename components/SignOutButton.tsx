"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-full px-3 py-1.5 text-sm text-black/70 transition hover:bg-black/5 hover:text-black"
    >
      Sign out
    </button>
  );
}
