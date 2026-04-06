import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiLogin, apiLogout, apiMe, apiRegister, apiUpdateMe, type AuthUser, type BackendRole } from "@/lib/api";

export type UserRole = "client" | "operative" | "admin";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: BackendRole }) => Promise<void>;
  logout: () => Promise<void>;
  updateAccount: (patch: Partial<{ name: string; email: string; password: string }>) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const TOKEN_KEY = "auth.token";
const USER_KEY = "auth.user";
const UI_ROLE_KEY = "ui.role";

function mapBackendRole(role: BackendRole): UserRole {
  if (role === "ADMIN") return "admin";
  if (role === "OPERATIVE") return "operative";
  return "client";
}

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(UI_ROLE_KEY);
    if (saved === "client" || saved === "operative" || saved === "admin") return saved;
    return "client";
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const setRole = (nextRole: UserRole) => {
    setRoleState(nextRole);
    localStorage.setItem(UI_ROLE_KEY, nextRole);
  };

  const setSession = (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setRole(mapBackendRole(nextUser.role));
  };

  const logout = async () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (currentToken) {
      try {
        await apiLogout(currentToken);
      } catch {
        // ignore
      }
    }
  };

  const login = async (email: string, password: string) => {
    const resp = await apiLogin({ email, password });
    setSession(resp.token, resp.user);
  };

  const register = async (input: { name: string; email: string; password: string; role: BackendRole }) => {
    const resp = await apiRegister(input);
    setSession(resp.token, resp.user);
  };

  const updateAccount = async (patch: Partial<{ name: string; email: string; password: string }>) => {
    if (!token) throw new Error("Not authenticated");
    const updated = await apiUpdateMe(token, patch);
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setRole(mapBackendRole(updated.role));
  };

  useEffect(() => {
    if (!token) return;
    apiMe(token)
      .then((u) => {
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setRole(mapBackendRole(u.role));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      });
  }, [token]);

  return (
    <RoleContext.Provider value={{ role, setRole, token, user, login, register, logout, updateAccount }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
