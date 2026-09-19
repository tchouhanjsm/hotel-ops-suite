import { apiFetch } from "./client";

export type PaymentMethod =
  | "cash"
  | "card"
  | "upi"
  | "bank_transfer"
  | "other";

export type PaymentStatus = "completed" | "voided";

export type Payment = {
  id: number;
  payment_reference: string;
  folio_id: number;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  received_by: number;
  received_at: string;
  external_reference: string | null;
  notes: string | null;
};

export type PaymentCreate = {
  folio_id: number;
  amount: number;
  payment_method: PaymentMethod;
  external_reference?: string | null;
  notes?: string | null;
};

export function getPayments(folioId: number) {
  return apiFetch<Payment[]>(`/payments/folio/${folioId}`);
}

export function createPayment(data: PaymentCreate) {
  return apiFetch<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function voidPayment(paymentId: number) {
  return apiFetch<Payment>(`/payments/${paymentId}/void`, {
    method: "POST",
  });
}
