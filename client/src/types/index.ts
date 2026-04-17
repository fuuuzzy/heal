export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar_emoji: string;
  partner_id?: number;
  partner?: User;
  created_at: string;
}

export interface Partnership {
  id: number;
  user1_id: number;
  user2_id: number | null;
  invite_code: string;
  status: 'pending' | 'active';
  created_at: string;
}

export interface SavingsPlan {
  id: number;
  name: string;
  target_amount: number;
  cell_count: number;
  cell_amount: number;
  created_by: number;
  partner_id?: number | null;
  status: 'active' | 'completed' | 'overdue' | 'archived';
  cell_theme?: string;
  deadline?: string;
  created_at: string;
  filled_cells?: number;
  partner_nickname?: string | null;
  partner_avatar?: string | null;
  archived_at?: string | null;
}

export type CellStatus = 'empty' | 'filled' | 'unfill_pending';

export interface EmojiReaction {
  emoji: string;
  user_id: number;
}

export interface SavingsCell {
  id: number;
  plan_id: number;
  cell_index: number;
  filled_by: number;
  amount: number;
  pledge_content: string;
  pledge_signed_at: string;
  note?: string;
  status: 'filled' | 'unfill_pending';
  unfill_requested_by?: number;
  unfill_requested_at?: string;
  filled_at: string;
}

export interface CellState {
  index: number;
  status: CellStatus;
  filled_by?: number;
  pledge_content?: string;
  filled_at?: string;
  unfill_requested_by?: number;
  reactions?: EmojiReaction[];
}

export interface PlanDetail extends SavingsPlan {
  cells: CellState[];
  stats: PlanStats;
  streak: Streak;
  partner_nickname?: string | null;
  partner_avatar?: string | null;
  creator_nickname?: string | null;
  creator_avatar?: string | null;
  archived_at?: string | null;
}

export interface PlanStats {
  total_cells: number;
  filled_cells: number;
  total_amount: number;
  filled_amount: number;
  progress_percent: number;
  my_filled: number;
  partner_filled: number;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
}

export interface Activity {
  id: number;
  user_id: number;
  plan_id: number;
  action: string;
  detail: string | null;
  created_at: string;
  nickname: string;
  plan_name: string;
}

export interface HeatmapPoint {
  date: string;
  count: number;
}

export interface TrendPoint {
  week: string;
  amount: number;
}

export interface DashboardData {
  total_saved: number;
  total_target: number;
  active_plans: number;
  month_deposits: number;
  total_filled: number;
  total_cells: number;
  activities: Activity[];
  streaks: { plan_id: number; current_streak: number; longest_streak: number }[];
  heatmap: HeatmapPoint[];
  trend: TrendPoint[];
}

export interface FillResult {
  success: boolean;
  completed: boolean;
  hit_milestone: number | null;
  filled_count: number;
  total_count: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
