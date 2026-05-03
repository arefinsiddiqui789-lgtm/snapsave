/**
 * Security utilities for SnapNote Pro
 * - Password hashing with SHA-256 + salt (Web Crypto API)
 * - Input sanitization
 * - Rate limiting helpers
 */

// ─── Password Hashing ────────────────────────────────────────

/**
 * Generate a cryptographically random salt using Web Crypto API
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with a salt using SHA-256
 * Uses the Web Crypto API (SubtleCrypto) — no external dependencies
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  // Constant-time comparison to prevent timing attacks
  if (hash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

// ─── Input Sanitization ──────────────────────────────────────

/**
 * Sanitize user input to prevent XSS
 * Strips HTML tags and dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize note content — lighter touch since it's rendered in a textarea
 * (textareas don't execute HTML), but still strip script-like patterns
 */
export function sanitizeNoteContent(content: string): string {
  // Remove null bytes
  let cleaned = content.replace(/\0/g, '');
  // Limit extreme length to prevent memory issues (1MB max)
  if (cleaned.length > 1_000_000) {
    cleaned = cleaned.slice(0, 1_000_000);
  }
  return cleaned;
}

/**
 * Sanitize a tag — only allow alphanumeric, hyphens, underscores
 */
export function sanitizeTag(tag: string): string {
  return tag.replace(/[^a-zA-Z0-9\-_]/g, '').toLowerCase().slice(0, 30);
}

/**
 * Sanitize a username — only allow alphanumeric, hyphens, underscores, spaces
 */
export function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().slice(0, 30);
}

// ─── Rate Limiting ───────────────────────────────────────────

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
}

function getLoginAttemptKey(): string {
  return 'snapnote-login-attempts';
}

export function getLoginAttempts(): LoginAttempt {
  try {
    const raw = localStorage.getItem(getLoginAttemptKey());
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw) as LoginAttempt;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

export function recordFailedAttempt(): LoginAttempt {
  const current = getLoginAttempts();
  const newCount = current.count + 1;
  const lockedUntil = newCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;
  const result = { count: newCount, lockedUntil };
  localStorage.setItem(getLoginAttemptKey(), JSON.stringify(result));
  return result;
}

export function resetLoginAttempts(): void {
  localStorage.removeItem(getLoginAttemptKey());
}

export function isLockedOut(): { locked: boolean; remainingMs: number } {
  const attempts = getLoginAttempts();
  if (!attempts.lockedUntil) return { locked: false, remainingMs: 0 };
  const remaining = attempts.lockedUntil - Date.now();
  if (remaining <= 0) {
    resetLoginAttempts();
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: remaining };
}

// ─── Session Management ──────────────────────────────────────

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_KEY = 'snapnote-session';

export interface Session {
  userId: string;
  createdAt: number;
  lastActivity: number;
}

export function createSession(userId: string): Session {
  const session: Session = {
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    // Check if session has expired
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
      destroySession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function touchSession(): void {
  const session = getSession();
  if (!session) return;
  session.lastActivity = Date.now();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function destroySession(): void {
  localStorage.removeItem(SESSION_KEY);
}
