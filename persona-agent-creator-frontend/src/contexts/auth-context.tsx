"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse } from "@/lib/api";

type AuthContextValue = {
  token: string | null;
  userName: string | null;
  userEmail: string | null;
  isReady: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const n = localStorage.getItem("userName");
    const e = localStorage.getItem("userEmail");
    if (t) setToken(t);
    if (n) setUserName(n);
    if (e) setUserEmail(e);
    setIsReady(true);
  }, []);

  const login = useCallback((data: AuthResponse) => {
    setToken(data.accessToken);
    setUserName(data.user.name);
    setUserEmail(data.user.email);
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userEmail", data.user.email);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserName(null);
    setUserEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
  }, []);

  const value = useMemo(
    () => ({
      token,
      userName,
      userEmail,
      isReady,
      login,
      logout,
    }),
    [token, userName, userEmail, isReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
