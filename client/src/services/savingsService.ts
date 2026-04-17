import { api } from './api'
import type { SavingsPlan, PlanDetail, PlanStats, Partnership, DashboardData, FillResult } from '../types'

export const savingsService = {
  createPlan: (data: { name: string; target_amount: number; cell_count: number; cell_theme?: string; deadline?: string }) =>
    api.post<SavingsPlan>('/plans', data),

  getPlans: () => api.get<SavingsPlan[]>('/plans'),

  getPlan: (id: number) => api.get<PlanDetail>(`/plans/${id}`),

  getDashboard: () => api.get<DashboardData>('/plans/dashboard'),

  fillCell: (planId: number, cellIndex: number, data: { pledge_content: string; note?: string }) =>
    api.post<FillResult>(`/plans/${planId}/cells/${cellIndex}/fill`, data),

  requestUnfill: (planId: number, cellIndex: number) =>
    api.post<{ success: boolean }>(`/plans/${planId}/cells/${cellIndex}/unfill-request`),

  approveUnfill: (planId: number, cellIndex: number) =>
    api.post<{ success: boolean }>(`/plans/${planId}/cells/${cellIndex}/unfill-approve`),

  reactCell: (planId: number, cellIndex: number, emoji: string) =>
    api.post<{ success: boolean }>(`/plans/${planId}/cells/${cellIndex}/react`, { emoji }),

  archivePlan: (planId: number) =>
    api.post<{ success: boolean; archived_at: string }>(`/plans/${planId}/archive`),

  deletePlan: (planId: number) =>
    api.delete<{ success: boolean }>(`/plans/${planId}`),

  getStats: (planId: number) => api.get<PlanStats>(`/plans/${planId}/stats`),

  generateInviteCode: () => api.post<Partnership>('/partner/invite'),

  bindPartner: (inviteCode: string) =>
    api.post<Partnership>('/partner/bind', { invite_code: inviteCode }),

  getPartnerStatus: () => api.get<Partnership | null>('/partner/status'),
}
