'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  username: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signup: (username: string, password: string) => boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      signup: (username: string, password: string) => {
        const existing = get().user;
        if (existing) return false;
        set({
          user: { username, password },
          isAuthenticated: true,
        });
        return true;
      },

      login: (username: string, password: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.username === username && user.password === password) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false });
      },
    }),
    {
      name: 'snapnote-auth',
    }
  )
);
