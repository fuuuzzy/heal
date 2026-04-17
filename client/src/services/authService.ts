import { api } from './api'
import type { AuthResponse, User } from '../types'

export const authService = {
  register: (data: { username: string; password: string; nickname: string; avatar_emoji: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () => api.get<User>('/auth/me'),
}
