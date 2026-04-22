import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string, avatarEmoji: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (token) {
        try {
          const userData = await authService.me();
          setUser(userData);
        } catch {
          await storage.clearToken();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authService.login(username, password);
    await storage.setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (
    username: string,
    password: string,
    nickname: string,
    avatarEmoji: string
  ) => {
    const res = await authService.register({
      username,
      password,
      nickname,
      avatar_emoji: avatarEmoji,
    });
    await storage.setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await storage.clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const userData = await authService.me();
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
