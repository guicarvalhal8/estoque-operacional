"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const response = await api<{ user: User }>("/auth/me");
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login: async ({ email, password }) => {
      const response = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setUser(response.user);
      router.push("/dashboard");
    },
    logout: async () => {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    },
    refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
