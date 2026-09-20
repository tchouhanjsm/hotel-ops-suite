import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  getCurrentStaff,
  login as loginRequest,
  type Staff,
} from "../api/auth";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./AuthContext";

const ACCESS_TOKEN_KEY = "access_token";
const LEGACY_STAFF_KEY = "staff";

type Props = {
  children: ReactNode;
};

export default function AuthProvider({ children }: Props) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(ACCESS_TOKEN_KEY) ? "loading" : "unauthenticated",
  );

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      return;
    }

    let cancelled = false;

    getCurrentStaff()
      .then((currentStaff) => {
        if (cancelled) {
          return;
        }

        setStaff(currentStaff);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(LEGACY_STAFF_KEY);
        setStaff(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<Staff> => {
      const data = await loginRequest(username, password);

      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      localStorage.removeItem(LEGACY_STAFF_KEY);

      setStaff(data.staff);
      setStatus("authenticated");

      return data.staff;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_STAFF_KEY);
    setStaff(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      staff,
      status,
      login,
      logout,
    }),
    [staff, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
