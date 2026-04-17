'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { registerAuthHandlers } from '@/services/api/client';
import { UserRole } from '@/utils/constants';

export interface AuthUser {
  userId: number;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, userId: number, role: UserRole) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  // Sayfa yenilendikten sonra refresh denemesi yapılıyor mu?
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((token: string) => {
    tokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const getAccessToken = useCallback(() => tokenRef.current, []);

  const login = useCallback(
    (token: string, userId: number, role: UserRole) => {
      setAccessToken(token);
      setUser({ userId, role });
    },
    [setAccessToken],
  );

  const logout = useCallback(() => {
    tokenRef.current = null;
    setAccessTokenState(null);
    setUser(null);
  }, []);

  // Axios handler'larını kaydet (circular import olmadan)
  useEffect(() => {
    registerAuthHandlers(getAccessToken, setAccessToken, logout);
  }, [getAccessToken, setAccessToken, logout]);

  // Sayfa yenilendiğinde in-memory token kaybolur.
  // Refresh endpoint'ini çağırarak yeni access token al.
  useEffect(() => {
    let cancelled = false;

    async function tryRefresh() {
      try {
        // Dinamik import — client.ts'nin registerAuthHandlers'ı çalıştıktan sonra çağrılır
        const { default: apiClient } = await import('@/services/api/client');
        const { data } = await apiClient.post<{
          accessToken: string;
          userId: number;
          role: UserRole;
        }>('/api/auth/refresh');
        if (!cancelled) {
          login(data.accessToken, data.userId, data.role);
        }
      } catch {
        // Refresh başarısız → kullanıcı oturum açmamış, normal durum
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, [login]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isLoading, login, logout }),
    [user, accessToken, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
