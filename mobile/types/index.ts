// 用户类型
export interface User {
    id: number;
    username: string;
    nickname: string;
    avatar_emoji: string;
    partner_id?: number;
    partner?: User;
    created_at: string;
}

// 伴侣关系
export interface Partnership {
    id: number;
    user1_id: number;
    user2_id: number | null;
    invite_code: string;
    status: 'pending' | 'active';
    created_at: string;
}

// 储蓄计划
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

// 格子状态
export type CellStatus = 'empty' | 'filled' | 'unfill_pending';

// 表情反应
export interface EmojiReaction {
    emoji: string;
    user_id: number;
}

// 格子状态
export interface CellState {
    index: number;
    status: CellStatus;
    filled_by?: number;
    pledge_content?: string;
    filled_at?: string;
    unfill_requested_by?: number;
    reactions?: EmojiReaction[];
}

// 计划详情
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

// 计划统计
export interface PlanStats {
    total_cells: number;
    filled_cells: number;
    total_amount: number;
    filled_amount: number;
    progress_percent: number;
    my_filled: number;
    partner_filled: number;
}

// 连续记录
export interface Streak {
    current_streak: number;
    longest_streak: number;
}

// 活动记录
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

// 热力图数据点
export interface HeatmapPoint {
    date: string;
    count: number;
}

// 趋势数据点
export interface TrendPoint {
    week: string;
    amount: number;
}

// 仪表盘数据
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

// 填充结果
export interface FillResult {
    success: boolean;
    completed: boolean;
    hit_milestone: number | null;
    filled_count: number;
    total_count: number;
}

// 认证响应
export interface AuthResponse {
    token: string;
    user: User;
}
