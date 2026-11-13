'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { TransportationMode } from '@/types';

export type UserRole = 'basic' | 'mode-admin' | 'admin' | 'super-admin';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  mode?: TransportationMode;
  active: boolean;
  createdAt: string;
}

interface StoredAccount extends UserAccount {
  salt: string;
  passwordHash: string;
}

interface AuthContextValue {
  isReady: boolean;
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  isFirstRun: boolean;
  error: string | null;
  clearError: () => void;
  login: (username: string, password: string) => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
  createAccount: (input: AccountInput) => Promise<void>;
  updateAccount: (id: string, input: AccountUpdate) => Promise<void>;
  deleteAccount: (id: string) => void;
  logout: () => void;
}

export interface AccountInput {
  username: string;
  password: string;
  role: UserRole;
  mode?: TransportationMode;
}

export interface AccountUpdate {
  username: string;
  role: UserRole;
  mode?: TransportationMode;
  active: boolean;
  password?: string;
}

const USERS_STORAGE_KEY = 'tms.users.v1';
const SESSION_STORAGE_KEY = 'tms.session.v1';
const PBKDF2_ITERATIONS = 120_000;

const AuthContext = createContext<AuthContextValue | null>(null);

function isTransportationMode(value: unknown): value is TransportationMode {
  return value === 'FHWA' || value === 'FRA' || value === 'FTA' || value === 'MARAD';
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'basic' || value === 'mode-admin' || value === 'admin' || value === 'super-admin';
}

function validateAccountShape(value: unknown): value is StoredAccount {
  if (!value || typeof value !== 'object') return false;
  const account = value as Partial<StoredAccount>;
  const requiresMode = account.role === 'basic' || account.role === 'mode-admin';
  return (
    typeof account.id === 'string' &&
    typeof account.username === 'string' &&
    isUserRole(account.role) &&
    (requiresMode ? isTransportationMode(account.mode) : account.mode === undefined) &&
    typeof account.active === 'boolean' &&
    typeof account.createdAt === 'string' &&
    typeof account.salt === 'string' &&
    typeof account.passwordHash === 'string'
  );
}

function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password hashing is unavailable in this browser. Use HTTPS or localhost.');
  }

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return encodeHex(new Uint8Array(derivedBits));
}

async function createStoredAccount(input: AccountInput): Promise<StoredAccount> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const mode = input.role === 'basic' || input.role === 'mode-admin' ? input.mode : undefined;
  if ((input.role === 'basic' || input.role === 'mode-admin') && !mode) {
    throw new Error('Choose a transportation mode for Basic and Mode-Admin users.');
  }
  return {
    id: crypto.randomUUID(),
    username: input.username.trim(),
    role: input.role,
    ...(mode ? { mode } : {}),
    active: true,
    createdAt: new Date().toISOString(),
    salt: encodeHex(salt),
    passwordHash: await hashPassword(input.password, salt),
  };
}

function sanitizeAccount(account: StoredAccount): UserAccount {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    ...(account.mode ? { mode: account.mode } : {}),
    active: account.active,
    createdAt: account.createdAt,
  };
}

function validateCredentials(username: string, password: string): void {
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username.trim())) {
    throw new Error('Username must be 3-32 characters and use only letters, numbers, dots, underscores, or hyphens.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedAccounts = localStorage.getItem(USERS_STORAGE_KEY);
        const parsed: unknown = savedAccounts ? JSON.parse(savedAccounts) : [];
        if (!Array.isArray(parsed) || !parsed.every(validateAccountShape)) {
          throw new Error('Saved user data is invalid. Clear this site’s local storage and set up the first administrator again.');
        }
        setStoredAccounts(parsed);

        const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessionAccount = parsed.find((account) => account.id === sessionId && account.active);
        if (sessionAccount) setCurrentUserId(sessionAccount.id);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load saved user data.');
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currentStoredAccount = storedAccounts.find((account) => account.id === currentUserId && account.active) ?? null;
  const accounts = useMemo(() => storedAccounts.map(sanitizeAccount), [storedAccounts]);
  const currentUser = currentStoredAccount ? sanitizeAccount(currentStoredAccount) : null;

  const commitAccounts = useCallback((next: StoredAccount[]) => {
    saveAccounts(next);
    setStoredAccounts(next);
    setError(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const account = storedAccounts.find((candidate) => candidate.username.toLowerCase() === username.trim().toLowerCase());
    if (!account || !account.active || (await hashPassword(password, decodeHex(account.salt))) !== account.passwordHash) {
      throw new Error('Incorrect username or password, or this account is inactive.');
    }
    localStorage.setItem(SESSION_STORAGE_KEY, account.id);
    setCurrentUserId(account.id);
    setError(null);
  }, [storedAccounts]);

  const setup = useCallback(async (username: string, password: string) => {
    if (storedAccounts.length > 0) throw new Error('Initial setup is already complete. Sign in with an administrator account.');
    validateCredentials(username, password);
    const account = await createStoredAccount({ username, password, role: 'super-admin' });
    commitAccounts([account]);
    localStorage.setItem(SESSION_STORAGE_KEY, account.id);
    setCurrentUserId(account.id);
  }, [commitAccounts, storedAccounts.length]);

  const createAccount = useCallback(async (input: AccountInput) => {
    if (currentUser?.role !== 'super-admin') throw new Error('Only a Super Admin can create user accounts.');
    validateCredentials(input.username, input.password);
    if (storedAccounts.some((account) => account.username.toLowerCase() === input.username.trim().toLowerCase())) {
      throw new Error('That username is already in use.');
    }
    commitAccounts([...storedAccounts, await createStoredAccount(input)]);
  }, [commitAccounts, currentUser, storedAccounts]);

  const updateAccount = useCallback(async (id: string, input: AccountUpdate) => {
    if (currentUser?.role !== 'super-admin') throw new Error('Only a Super Admin can update user accounts.');
    validateCredentials(input.username, input.password || 'placeholder');
    const existing = storedAccounts.find((account) => account.id === id);
    if (!existing) throw new Error('The selected user account no longer exists.');
    if (storedAccounts.some((account) => account.id !== id && account.username.toLowerCase() === input.username.trim().toLowerCase())) {
      throw new Error('That username is already in use.');
    }

    const nextRole = input.role;
    const nextMode = nextRole === 'basic' || nextRole === 'mode-admin' ? input.mode : undefined;
    if ((nextRole === 'basic' || nextRole === 'mode-admin') && !nextMode) {
      throw new Error('Choose a transportation mode for Basic and Mode-Admin users.');
    }
    const updated: StoredAccount = {
      ...existing,
      username: input.username.trim(),
      role: nextRole,
      ...(nextMode ? { mode: nextMode } : {}),
      active: input.active,
    };
    if (!nextMode) delete updated.mode;

    if (existing.role === 'super-admin' && existing.active && (nextRole !== 'super-admin' || !input.active)) {
      const otherActiveSuperAdmins = storedAccounts.filter(
        (account) => account.id !== id && account.role === 'super-admin' && account.active
      );
      if (otherActiveSuperAdmins.length === 0) throw new Error('At least one active Super Admin account must remain.');
    }

    if (input.password) {
      validateCredentials(input.username, input.password);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      updated.salt = encodeHex(salt);
      updated.passwordHash = await hashPassword(input.password, salt);
    }
    commitAccounts(storedAccounts.map((account) => account.id === id ? updated : account));
  }, [commitAccounts, currentUser, storedAccounts]);

  const deleteAccount = useCallback((id: string) => {
    if (currentUser?.role !== 'super-admin') throw new Error('Only a Super Admin can delete user accounts.');
    const target = storedAccounts.find((account) => account.id === id);
    if (!target) throw new Error('The selected user account no longer exists.');
    if (id === currentUserId) throw new Error('You cannot delete the account you are currently using.');
    if (target.role === 'super-admin' && target.active && !storedAccounts.some(
      (account) => account.id !== id && account.role === 'super-admin' && account.active
    )) {
      throw new Error('At least one active Super Admin account must remain.');
    }
    commitAccounts(storedAccounts.filter((account) => account.id !== id));
  }, [commitAccounts, currentUser, currentUserId, storedAccounts]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUserId(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isReady,
    currentUser,
    accounts,
    isFirstRun: isReady && storedAccounts.length === 0,
    error,
    clearError: () => setError(null),
    login,
    setup,
    createAccount,
    updateAccount,
    deleteAccount,
    logout,
  }), [accounts, createAccount, currentUser, deleteAccount, error, isReady, login, logout, setup, storedAccounts.length, updateAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}

export function canAccessMode(user: UserAccount | null, mode: string): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'super-admin') return true;
  return user.mode === mode;
}

export function canEditContent(user: UserAccount | null): boolean {
  return Boolean(user);
}

export function canDeleteContent(user: UserAccount | null): boolean {
  return user?.role !== 'basic' && Boolean(user);
}

export function canApproveContent(user: UserAccount | null): boolean {
  return user?.role === 'mode-admin' || user?.role === 'super-admin';
}

function AuthenticationScreen() {
  const { isFirstRun, login, setup, error: storageError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (isFirstRun) await setup(username, password);
      else await login(username, password);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Unable to authenticate this account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-800">Tracking &amp; Monitoring System</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{isFirstRun ? 'Create the first Super Admin' : 'Sign in'}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isFirstRun
            ? 'Initial setup creates your administrator account. Use it to add users and assign access.'
            : 'Use the username and password provided by your administrator.'}
        </p>
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          Demo authentication: accounts are stored in this browser only. Do not use real or reused passwords; this is not production access control.
        </div>
        {(storageError || formError) && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{storageError || formError}</p>
        )}
        {!storageError && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Username
              <input
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password {isFirstRun && <span className="font-normal text-slate-500">(at least 8 characters)</span>}
              <input
                autoComplete={isFirstRun ? 'new-password' : 'current-password'}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#005a9c] px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait…' : isFirstRun ? 'Create Super Admin' : 'Sign in'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isReady, currentUser } = useAuth();

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading user access…</div>;
  }
  if (!currentUser) return <AuthenticationScreen />;

  return <>{children}</>;
}

export function AccessDenied({ message }: { message: string }) {
  const { logout } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow">
        <h1 className="text-xl font-bold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-md bg-[#005a9c] px-4 py-2 text-sm font-semibold text-white">Return to projects</Link>
          <button onClick={logout} className="rounded-md border px-4 py-2 text-sm font-semibold text-slate-700">Sign out</button>
        </div>
      </section>
    </main>
  );
}
