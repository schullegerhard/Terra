import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase.rpc("get_leaderboard", { p_limit: 50 });
  const { data: myRank } = await supabase.rpc("get_user_rank", {
    p_user_id: user.id,
  });

  const list = (rows ?? []) as {
    rank: number;
    user_id: string;
    username: string;
    avatar: string | null;
    xp: number;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-black/55">Top 50 players by XP.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="text-black/50">Your rank</p>
          <p className="text-2xl font-semibold tabular-nums">
            {myRank != null ? `#${myRank}` : "—"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.02] text-xs uppercase tracking-wide text-black/50">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr
                key={row.user_id}
                className={
                  row.user_id === user.id
                    ? "bg-black/[0.04]"
                    : "border-b border-black/5 last:border-0"
                }
              >
                <td className="px-4 py-3 font-mono text-black/70">#{row.rank}</td>
                <td className="px-4 py-3 font-medium">{row.username}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
