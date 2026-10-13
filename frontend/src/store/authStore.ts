import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  /** JWT Token，未登录为 null */
  token: string | null;
  /** 当前登录用户，未登录为 null */
  user: User | null;

  login: (token: string, user: User) => void;
  logout: () => void;
  getIsAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),

      getIsAuthenticated: () => get().token != null,
    }),
    { name: 'auth-storage' },
  ),
);
