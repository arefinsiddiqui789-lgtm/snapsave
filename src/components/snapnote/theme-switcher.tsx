'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeStore, COLOR_THEMES, ColorTheme } from '@/store/theme-store';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Apply data-theme attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
  }, [colorTheme]);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const selectColor = (name: ColorTheme) => {
    setColorTheme(name);
    document.documentElement.setAttribute('data-theme', name);
  };

  const currentTheme = COLOR_THEMES.find((t) => t.name === colorTheme);

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={toggleDarkMode}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground relative"
          onClick={() => setOpen(!open)}
          title="Color theme"
        >
          <Palette className="h-3.5 w-3.5" />
          <span
            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: currentTheme?.color }}
          />
        </Button>
      </div>

      {/* Color picker panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border rounded-xl shadow-lg p-3 w-[220px]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Color Theme
            </p>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => selectColor(t.name)}
                  title={t.label}
                  className={`
                    group relative h-8 w-8 rounded-full border-2 transition-all active:scale-90
                    ${colorTheme === t.name
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:border-muted-foreground/40 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: t.color }}
                >
                  {colorTheme === t.name && (
                    <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 text-center">
              <p className="text-[11px] font-medium text-foreground">{currentTheme?.label}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
