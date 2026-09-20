import { createContext } from "react";

import type { Staff } from "../api/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthContextValue = {
  staff: Staff | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<Staff>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
