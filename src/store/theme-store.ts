'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorTheme =
  | 'emerald'
  | 'rose'
  | 'ocean'
  | 'sunset'
  | 'amber'
  | 'violet'
  | 'cherry'
  | 'slate'
  | 'forest'
  | 'lavender';

export interface ColorThemeInfo {
  name: ColorTheme;
  label: string;
  color: string; // Tailwind class or hex for the preview swatch
}

export const COLOR_THEMES: ColorThemeInfo[] = [
  { name: 'emerald', label: 'Emerald', color: '#10b981' },
  { name: 'rose', label: 'Rose', color: '#f43f5e' },
  { name: 'ocean', label: 'Ocean', color: '#06b6d4' },
  { name: 'sunset', label: 'Sunset', color: '#f97316' },
  { name: 'amber', label: 'Amber', color: '#f59e0b' },
  { name: 'violet', label: 'Violet', color: '#8b5cf6' },
  { name: 'cherry', label: 'Cherry', color: '#e11d48' },
  { name: 'slate', label: 'Slate', color: '#64748b' },
  { name: 'forest', label: 'Forest', color: '#16a34a' },
  { name: 'lavender', label: 'Lavender', color: '#a78bfa' },
];

interface ThemeState {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colorTheme: 'emerald',
      setColorTheme: (theme: ColorTheme) => set({ colorTheme: theme }),
    }),
    {
      name: 'snapnote-color-theme',
    }
  )
);
