import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/tasks", label: "Tasks" },
  { href: "/discover", label: "Discover" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/waitlist", label: "Waitlist" },
];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-black"
        >
          Terra
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-black/80 transition hover:bg-black/5 hover:text-black"
            >
              {l.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 font-medium text-black ring-1 ring-black/15 transition hover:bg-black hover:text-white"
            >
              Admin
            </Link>
          ) : null}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
