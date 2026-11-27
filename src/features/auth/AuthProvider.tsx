import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isApiError, setUnauthorizedHandler } from '../../services/api';
import { accountStorage, type StoredAccount } from '../../services/auth/accountStorage';
import { tokenStorage } from '../../services/auth/tokenStorage';
import type { User } from '../../types/models';
import { authApi } from './authApi';

type AuthState = {
  user: User | null;
  /** Every account signed in on this device (the reference app's "Add account"). */
  accounts: StoredAccount[];
  /** True while a stored session is being restored at launch. */
  restoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  switchAccount: (userId: number) => Promise<void>;
  /** Signs out the current account; switches to another signed-in account if there is one. */
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

const toStored = (u: User, token: string): StoredAccount => ({ userId: u.id, name: u.name, email: u.email, color: u.color, role: u.role, token });
const fromStored = (a: StoredAccount): User => ({ id: a.userId, name: a.name, email: a.email, color: a.color, role: a.role ?? 'member' });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [restoring, setRestoring] = useState(true);

  const reloadAccounts = useCallback(async () => setAccounts(await accountStorage.list()), []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  // Session restoration: reuse the stored token and validate it against /auth/me.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          // A phone that just woke up or rebooted often has no network yet: retry before giving up.
          let me: User | null = null;
          for (let attempt = 0; ; attempt++) {
            try {
              me = await authApi.me();
              break;
            } catch (e) {
              // Only a rejected token signs the user out. Anything else (offline, timeout, server down) keeps it.
              if (isApiError(e) && (e.kind === 'unauthorized' || e.kind === 'forbidden')) throw e;
              if (attempt >= 2) break;
              await wait(1500 * (attempt + 1));
            }
          }
          if (me) {
            if (alive) setUser(me);
            // Older installs only had a single token: register it as an account.
            await accountStorage.upsert(toStored(me, token));
          } else {
            // Still offline: open the app with the saved account; screens load once the connection is back.
            const saved = (await accountStorage.list()).find((a) => a.token === token);
            if (saved && alive) setUser(fromStored(saved));
            else if (!saved) await tokenStorage.set(null);
          }
        }
      } catch {
        await tokenStorage.set(null);
      } finally {
        await reloadAccounts();
        if (alive) setRestoring(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadAccounts]);

  const activate = useCallback(
    async (token: string, u: User) => {
      await tokenStorage.set(token);
      queryClient.clear();
      setUser(u);
      await accountStorage.upsert(toStored(u, token));
      await reloadAccounts();
    },
    [queryClient, reloadAccounts],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await authApi.login(email.trim(), password);
      await activate(r.token, r.user);
    },
    [activate],
  );

  const switchAccount = useCallback(
    async (userId: number) => {
      const acc = (await accountStorage.list()).find((a) => a.userId === userId);
      if (!acc) return;
      const prev = await tokenStorage.get();
      await tokenStorage.set(acc.token);
      try {
        const me = await authApi.me();
        await activate(acc.token, me);
      } catch (e) {
        // Expired token: drop that account and stay on the current one.
        await accountStorage.remove(userId);
        await tokenStorage.set(prev);
        await reloadAccounts();
        throw new Error(`${acc.email} was signed out. Add the account again.`, { cause: e });
      }
    },
    [activate, reloadAccounts],
  );

  const logout = useCallback(async () => {
    if (user) await accountStorage.remove(user.id);
    const rest = await accountStorage.list();
    await tokenStorage.set(null);
    queryClient.clear();
    setUser(null);
    await reloadAccounts();
    for (const a of rest) {
      try {
        await tokenStorage.set(a.token);
        const me = await authApi.me();
        await activate(a.token, me);
        return;
      } catch {
        await accountStorage.remove(a.userId);
      }
    }
    await tokenStorage.set(null);
    await reloadAccounts();
  }, [user, queryClient, reloadAccounts, activate]);

  const refreshUser = useCallback(async () => {
    setUser(await authApi.me());
  }, []);

  const value = useMemo(
    () => ({ user, accounts, restoring, login, switchAccount, logout, refreshUser }),
    [user, accounts, restoring, login, switchAccount, logout, refreshUser],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Client users get a restricted experience in the web app (lib/client.js); the mobile UI follows the same rule. */
export const isClientUser = (u: User | null) => u?.role === 'client';
