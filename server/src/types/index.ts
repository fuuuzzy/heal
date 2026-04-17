export interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  nickname: string;
  avatar_emoji: string;
  partner_id: number | null;
  created_at: string;
}

export interface DbPartnership {
  id: number;
  user1_id: number;
  user2_id: number;
  invite_code: string;
  status: 'pending' | 'active';
  created_at: string;
}

export interface DbSavingsPlan {
  id: number;
  name: string;
  target_amount: number;
  cell_count: number;
  cell_amount: number;
  created_by: number;
  partner_id: number | null;
  status: 'active' | 'completed';
  created_at: string;
}

export interface DbSavingsCell {
  id: number;
  plan_id: number;
  cell_index: number;
  filled_by: number;
  amount: number;
  pledge_content: string | null;
  pledge_signed_at: string | null;
  note: string | null;
  status: 'filled' | 'unfill_pending';
  unfill_requested_by: number | null;
  unfill_approved_by: number | null;
  unfill_requested_at: string | null;
  filled_at: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
}
