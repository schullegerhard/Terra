"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function WaitlistClient({
  joined,
  joinedAt,
}: {
  joined: boolean;
  joinedAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("waitlist").insert({
      user_id: user.id,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("You are on the list!");
    router.refresh();
  };

  if (joined) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold">You are on the waitlist</p>
        {joinedAt ? (
          <p className="mt-2 text-sm text-black/55">
            Joined {new Date(joinedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-sm text-black/70">
        One click reserves your place. You can only join once.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void join()}
        className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {loading ? "Joining…" : "Join waitlist"}
      </button>
    </div>
  );
}
