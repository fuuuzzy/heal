import { api } from './api';
import type { AuthResponse, User } from '../types';

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', { username, password });
  },

  register: async (data: {
    username: string;
    password: string;
    nickname: string;
    avatar_emoji: string;
  }): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', data);
  },

  me: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },

  updateProfile: async (data: { nickname: string; avatar_emoji: string }): Promise<User> => {
    return api.put<User>('/auth/me', data);
  },

  logout: async (): Promise<void> => {
    return api.post<void>('/auth/logout');
  },
};
