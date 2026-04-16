"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const KEY = "terra_ref";

export function ReferralHandler() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const ref = localStorage.getItem(KEY);
      if (!ref) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("apply_referral", {
        p_ref: ref,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as { ok?: boolean; error?: string } | null;
      if (result?.ok) {
        localStorage.removeItem(KEY);
        toast.success("Referral linked. Your referrer earned rewards!");
      } else if (
        result?.error &&
        result.error !== "already_referred" &&
        result.error !== "invalid_ref"
      ) {
        if (result.error === "self_referral") {
          localStorage.removeItem(KEY);
          return;
        }
        if (result.error === "referrer_not_found") {
          toast.error("Referral code not found.");
          localStorage.removeItem(KEY);
        }
      }
    };

    void run();
  }, []);

  return null;
}
