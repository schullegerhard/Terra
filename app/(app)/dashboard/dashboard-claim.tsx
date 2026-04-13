"use client";

import { ClaimButton } from "@/components/ClaimButton";
import { useRouter } from "next/navigation";

export function DashboardClaim({ lastClaimAt }: { lastClaimAt: string | null }) {
  const router = useRouter();
  return (
    <ClaimButton
      lastClaimAt={lastClaimAt}
      onClaimed={() => {
        router.refresh();
      }}
    />
  );
}
