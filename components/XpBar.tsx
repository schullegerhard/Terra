import { xpProgress } from "@/lib/levels";

export function XpBar({ xp }: { xp: number }) {
  const { percent } = xpProgress(xp);
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-black/60">
        <span>XP progress</span>
        <span>{percent} / 100 to next level</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-black transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
