import { createContext, useContext, useState, type ReactNode } from "react";
import { getToken, setToken, clearToken } from "../api/client.js";
import { login as apiLogin, register as apiRegister, type AuthUser } from "../api/auth.js";

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

  const isAuthenticated = Boolean(getToken());

  async function login(email: string, password: string) {
    const result = await apiLogin(email, password);
    setToken(result.token);
    setUser(result.user);
  }

  async function register(email: string, password: string) {
    const result = await apiRegister(email, password);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    clearToken();
    setUser(null);
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
