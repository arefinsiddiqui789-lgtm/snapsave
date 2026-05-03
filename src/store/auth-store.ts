'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  isLockedOut,
  recordFailedAttempt,
  resetLoginAttempts,
  createSession,
  getSession,
  destroySession,
  sanitizeUsername,
  type Session,
} from '@/lib/security';

interface AuthUser {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  session: Session | null;
  initAuth: () => Promise<void>;
  signup: (username: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<{ success: boolean; lockedOut?: boolean; remainingMs?: number }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      session: null,

      initAuth: async () => {
        const { user } = get();
        if (!user) return;

        // Check for valid session
        const session = getSession();
        if (session && session.userId === user.username) {
          set({ isAuthenticated: true, session });
        } else {
          set({ isAuthenticated: false, session: null });
        }
      },

      signup: async (username: string, password: string) => {
        const existing = get().user;
        if (existing) return false;

        const cleanUsername = sanitizeUsername(username);
        if (cleanUsername.length < 2) return false;

        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);

        const newUser: AuthUser = {
          username: cleanUsername,
          passwordHash,
          salt,
          createdAt: Date.now(),
        };

        const session = createSession(cleanUsername);
        set({
          user: newUser,
          isAuthenticated: true,
          session,
        });
        resetLoginAttempts();
        return true;
      },

      login: async (username: string, password: string) => {
        const { user } = get();
        if (!user) return { success: false };

        // Check rate limiting
        const lockStatus = isLockedOut();
        if (lockStatus.locked) {
          return { success: false, lockedOut: true, remainingMs: lockStatus.remainingMs };
        }

        const cleanUsername = sanitizeUsername(username);

        // Verify credentials using constant-time comparison
        const valid = await verifyPassword(password, user.salt, user.passwordHash);

        if (valid && user.username === cleanUsername) {
          const session = createSession(cleanUsername);
          set({ isAuthenticated: true, session });
          resetLoginAttempts();
          return { success: true };
        }

        // Failed attempt
        const result = recordFailedAttempt();
        if (result.lockedUntil) {
          return {
            success: false,
            lockedOut: true,
            remainingMs: result.lockedUntil - Date.now(),
          };
        }
        return { success: false };
      },

      logout: () => {
        destroySession();
        set({ isAuthenticated: false, session: null });
      },
    }),
    {
      name: 'snapnote-auth',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
