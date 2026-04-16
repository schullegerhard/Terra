import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-white text-black">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-lg font-semibold tracking-tight">Terra</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-black/70 transition hover:text-black"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black/90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/45">
            Terra v1.5
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Daily rewards, quests, and partner games — built for community growth.
          </h1>
          <p className="text-lg text-black/60">
            Claim streak bonuses, complete social tasks, climb the XP leaderboard, and
            discover curated titles from Terra partners.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-black/90"
            >
              Start earning
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-black/15 px-6 py-3 text-sm font-semibold text-black transition hover:border-black/30"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Daily streaks",
              body: "UTC-day claims with escalating DP bonuses for consistent play.",
            },
            {
              title: "Social tasks",
              body: "Post, follow, and amplify Terra on X — verify when you are done.",
            },
            {
              title: "Partner discovery",
              body: "Featured games with a clean grid built for partner promotions.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="mt-2 text-sm text-black/55">{card.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-xs text-black/40">
        Terra · Ship fast, iterate faster.
      </footer>
    </div>
  );
}
