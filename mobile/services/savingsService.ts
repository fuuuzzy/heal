import { api } from './api';
import type { SavingsPlan, PlanDetail, DashboardData, FillResult } from '../types';

export const savingsService = {
  // 获取所有计划
  getPlans: async (): Promise<SavingsPlan[]> => {
    return api.get<SavingsPlan[]>('/plans');
  },

  // 获取仪表盘数据
  getDashboard: async (): Promise<DashboardData> => {
    return api.get<DashboardData>('/plans/dashboard');
  },

  // 获取计划详情
  getPlan: async (id: number): Promise<PlanDetail> => {
    return api.get<PlanDetail>(`/plans/${id}`);
  },

  // 创建计划
  createPlan: async (data: {
    name: string;
    target_amount: number;
    cell_count: number;
    deadline?: string;
    partner_id?: number;
  }): Promise<SavingsPlan> => {
    return api.post<SavingsPlan>('/plans', data);
  },

  // 填充格子
  fillCell: async (
    planId: number,
    cellIndex: number,
    data: { pledge_content: string; note?: string }
  ): Promise<FillResult> => {
    return api.post<FillResult>(`/plans/${planId}/cells/${cellIndex}/fill`, data);
  },

  // 请求撤销
  requestUnfill: async (planId: number, cellIndex: number): Promise<void> => {
    return api.post(`/plans/${planId}/cells/${cellIndex}/unfill-request`);
  },

  // 批准撤销
  approveUnfill: async (planId: number, cellIndex: number): Promise<void> => {
    return api.post(`/plans/${planId}/cells/${cellIndex}/unfill-approve`);
  },

  // 添加表情反应
  reactCell: async (planId: number, cellIndex: number, emoji: string): Promise<void> => {
    return api.post(`/plans/${planId}/cells/${cellIndex}/react`, { emoji });
  },

  // 归档计划
  archivePlan: async (id: number): Promise<void> => {
    return api.post(`/plans/${id}/archive`);
  },

  // 删除计划
  deletePlan: async (id: number): Promise<void> => {
    return api.delete(`/plans/${id}`);
  },

  // 获取归档计划
  getArchivedPlans: async (): Promise<SavingsPlan[]> => {
    return api.get<SavingsPlan[]>('/plans/archived');
  },
};
