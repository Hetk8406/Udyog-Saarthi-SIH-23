'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  LoginPayload,
  RegisterPayload,
} from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check existing session on component mount via HttpOnly cookie
  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch {
        // Unauthenticated or expired session
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Listen for session expiry from API client
  useEffect(() => {
    function handleSessionExpired(e: Event) {
      setUser(null);
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          const detail = (e as CustomEvent<{ returnTo?: string }>)?.detail;
          const returnTo = detail?.returnTo || `${currentPath}${window.location.search}`;
          router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}&sessionExpired=true`);
        }
      }
    }

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [router]);

  async function login(payload: LoginPayload): Promise<User> {
    const res = await loginApi(payload);
    setUser(res.user);
    return res.user;
  }

  async function register(payload: RegisterPayload): Promise<User> {
    const res = await registerApi(payload);
    setUser(res.user);
    return res.user;
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi();
    } catch {
      // Backend may be unreachable, continue client cleanup
    } finally {
      setUser(null);
    }
  }

  async function refreshUser(): Promise<void> {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
