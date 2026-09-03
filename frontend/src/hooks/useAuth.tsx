"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getToken, setToken, clearToken } from "../api/client";
import { login as apiLogin, register as apiRegister, type AuthUser } from "../api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()));

  async function login(email: string, password: string) {
    const result = await apiLogin(email, password);
    setToken(result.token);
    setUser(result.user);
    setIsAuthenticated(true);
  }

  async function register(email: string, password: string) {
    const result = await apiRegister(email, password);
    setToken(result.token);
    setUser(result.user);
    setIsAuthenticated(true);
  }

  function logout() {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
