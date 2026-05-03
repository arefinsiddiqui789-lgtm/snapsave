'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowRight, LogIn, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeUsername } from '@/lib/security';

function formatLockoutTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 1) return 'less than a minute';
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

export function AuthScreen() {
  const user = useAuthStore((s) => s.user);
  const signup = useAuthStore((s) => s.signup);
  const login = useAuthStore((s) => s.login);

  const isSignup = !user;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedUsername = username.trim();
      const trimmedPassword = password;

      if (!trimmedUsername) {
        toast.error('Please enter a username');
        return;
      }

      const cleanUsername = sanitizeUsername(trimmedUsername);
      if (cleanUsername.length < 2) {
        toast.error('Username must be at least 2 characters (letters, numbers, hyphens, underscores only)');
        return;
      }

      if (!trimmedPassword) {
        toast.error(isSignup ? 'Please create a password' : 'Please enter your password');
        return;
      }

      if (isSignup && trimmedPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      setIsLoading(true);

      try {
        if (isSignup) {
          const ok = await signup(cleanUsername, trimmedPassword);
          if (ok) {
            toast.success(`Welcome, ${cleanUsername}!`);
          } else {
            toast.error('Something went wrong');
          }
        } else {
          const result = await login(cleanUsername, trimmedPassword);
          if (result.success) {
            toast.success(`Welcome back, ${cleanUsername}!`);
          } else if (result.lockedOut) {
            toast.error(`Too many failed attempts. Try again in ${formatLockoutTime(result.remainingMs || 0)}`);
          } else {
            toast.error('Wrong username or password');
          }
        }
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
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
                  placeholder={isSignup ? 'Min. 6 characters' : 'Enter your password'}
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

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground">
              {isSignup ? 'Password encrypted & stored securely' : 'End-to-end encrypted session'}
            </span>
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-muted-foreground mt-4">
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
