export function ProfileSection({
  username,
  email,
  avatarUrl,
  gamesPlayedCount,
  likedCount,
  playStreak,
  dailyStreak,
  compact,
}: {
  username: string;
  email: string | null;
  avatarUrl: string | null;
  gamesPlayedCount: number;
  likedCount: number;
  playStreak: number;
  dailyStreak: number;
  compact?: boolean;
}) {
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <section
      className={`flex flex-col gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between ${compact ? "" : "sm:p-8"}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5 ring-2 ring-black/5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-black/40">
              {initial}
            </div>
          )}
        </div>
        <div>
          <h1
            className={`font-semibold tracking-tight ${compact ? "text-2xl" : "text-3xl"}`}
          >
            {username}
          </h1>
          {email ? (
            <p className="text-sm text-black/50">{email}</p>
          ) : (
            <p className="text-sm text-black/45">
              Signed in with X or a provider without a public email
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:max-w-md sm:flex-1">
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-3 text-center">
          <p className="text-2xl font-semibold tabular-nums">{gamesPlayedCount}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">
            Games played
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-3 text-center">
          <p className="text-2xl font-semibold tabular-nums">{likedCount}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">
            Liked
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-3 text-center">
          <p className="text-2xl font-semibold tabular-nums">{playStreak}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">
            Play streak
          </p>
          <p className="mt-1 text-[10px] text-black/35">Daily claim: {dailyStreak}d 🔥</p>
        </div>
      </div>
    </section>
  );
}
