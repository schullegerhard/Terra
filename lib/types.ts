export type UserProfile = {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
  dp: number;
  xp: number;
  streak: number;
  last_claim_at: string | null;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  role: string;
  created_at: string;
  game_play_streak?: number;
  last_game_activity_date?: string | null;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  reward_dp: number;
  reward_xp: number;
  link: string | null;
  is_active: boolean;
  is_daily: boolean;
  created_at: string;
};

export type GameRow = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  link: string;
  category: string | null;
  featured: boolean;
  created_at: string;
};
