const XP_PER_LEVEL = 100;

export function levelFromXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp: number) {
  const within = xp % XP_PER_LEVEL;
  return {
    current: within,
    target: XP_PER_LEVEL,
    percent: within,
  };
}
