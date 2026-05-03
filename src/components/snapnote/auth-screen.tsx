'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore, COLOR_THEMES, ColorTheme } from '@/store/theme-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowRight, LogIn, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthScreen() {
  const user = useAuthStore((s) => s.user);
  const signup = useAuthStore((s) => s.signup);
  const login = useAuthStore((s) => s.login);
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useThemeStore();

  const isSignup = !user;

  // Apply data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
  }, [colorTheme]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername) {
        toast.error('Please enter a username');
        return;
      }

      if (trimmedUsername.length < 2) {
        toast.error('Username must be at least 2 characters');
        return;
      }

      if (!trimmedPassword) {
        toast.error(isSignup ? 'Please create a password' : 'Please enter your password');
        return;
      }

      if (isSignup && trimmedPassword.length < 4) {
        toast.error('Password must be at least 4 characters');
        return;
      }

      setIsLoading(true);

      setTimeout(() => {
        if (isSignup) {
          const ok = signup(trimmedUsername, trimmedPassword);
          if (ok) {
            toast.success(`Welcome, ${trimmedUsername}!`);
          } else {
            toast.error('Something went wrong');
          }
        } else {
          const ok = login(trimmedUsername, trimmedPassword);
          if (ok) {
            toast.success(`Welcome back, ${trimmedUsername}!`);
          } else {
            toast.error('Wrong username or password');
          }
        }
        setIsLoading(false);
      }, 400);
    },
    [username, password, isSignup, signup, login]
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={isSignup ? 'signup' : 'login'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[380px]"
        >
          {/* Brand */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-title)] text-foreground tracking-tight">
              SnapNote Pro
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isSignup
                ? 'Create your account to get started'
                : 'Welcome back! Sign in to continue'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 text-sm border-border/60 focus:border-primary/40 transition-colors placeholder:text-muted-foreground"
                autoComplete="username"
                autoFocus
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                {isSignup ? 'Create a Password' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignup ? 'Create a password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-sm border-border/60 focus:border-primary/40 transition-colors placeholder:text-muted-foreground pr-11"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  maxLength={64}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.98] rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isSignup ? (
                <>
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Sign In
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            {isSignup
              ? 'Your notes are stored locally on this device'
              : 'Your data stays on this device'}
          </p>

          {/* Developer credit */}
          <div className="text-center mt-4 pt-4 border-t border-border/30">
            <p className="text-xs font-medium text-foreground">
              Developed By Arefin Siddiqui
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Studying in Computer Science and Engineering at IUB
            </p>
          </div>

          {/* Color theme picker */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center justify-center gap-2 mb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Theme
              </p>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-5 w-5 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setColorTheme(t.name)}
                  title={t.label}
                  className={`
                    h-5 w-5 rounded-full border-2 transition-all active:scale-90
                    ${colorTheme === t.name
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:border-muted-foreground/30 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: t.color }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
