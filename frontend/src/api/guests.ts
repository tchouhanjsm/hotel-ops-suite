import { apiFetch } from "./client";

export type Guest = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  id_type: string | null;
  id_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export function getGuests(query?: string) {
  const params = query?.trim()
    ? `?query=${encodeURIComponent(query.trim())}`
    : "";

  return apiFetch<Guest[]>(`/guests${params}`);
}
