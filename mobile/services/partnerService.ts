import { api } from './api';
import type { Partnership, User } from '../types';

export const partnerService = {
  // 获取伴侣信息
  getPartner: async (): Promise<User | null> => {
    return api.get<User | null>('/partner');
  },

  // 生成邀请码
  generateInviteCode: async (): Promise<{ code: string }> => {
    return api.post<{ code: string }>('/partner/invite');
  },

  // 绑定伴侣
  bindPartner: async (code: string): Promise<Partnership> => {
    return api.post<Partnership>('/partner/bind', { code });
  },

  // 解绑伴侣
  unbindPartner: async (): Promise<void> => {
    return api.delete('/partner');
  },
};
