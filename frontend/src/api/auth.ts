import { apiFetch } from "./client";

export type Staff = {
  id: number;
  username: string;
  full_name: string;
  role: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  staff: Staff;
};

export function login(username: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
