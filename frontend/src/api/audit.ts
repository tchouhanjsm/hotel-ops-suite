import { apiFetch } from "./client";

export type AuditLog = {
  id: number;
  staff_id: number;
  staff_username: string;
  staff_name: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export function getAuditLogs() {
  return apiFetch<AuditLog[]>("/audit-logs");
}
