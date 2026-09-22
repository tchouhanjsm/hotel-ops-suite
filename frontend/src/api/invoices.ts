import { apiFetch } from "./client";

export type InvoiceStatus = "draft" | "finalized" | "void";

export type Invoice = {
  id: number;
  invoice_number: string;
  folio_id: number;
  booking_id: number;
  status: InvoiceStatus;
  currency: string;
  bill_to_name: string;
  bill_to_phone: string;
  bill_to_email: string | null;
  bill_to_address: string | null;
  booking_reference: string;
  room_number: string;
  check_in: string;
  check_out: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  paid_amount: string;
  balance_due: string;
  notes: string | null;
  finalized_at: string | null;
  finalized_by: number | null;
  created_at: string;
};

export type InvoiceItem = {
  id: number;
  invoice_id: number;
  folio_item_id: number | null;
  item_type: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_percent: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  created_at: string;
};

export function getInvoices(status?: InvoiceStatus) {
  const query = status ? `?invoice_status=${encodeURIComponent(status)}` : "";
  return apiFetch<Invoice[]>(`/invoices${query}`);
}

export function getInvoice(invoiceId: number) {
  return apiFetch<Invoice>(`/invoices/${invoiceId}`);
}

export function getInvoiceByFolio(folioId: number) {
  return apiFetch<Invoice>(`/invoices/folio/${folioId}`);
}

export function getInvoiceItems(invoiceId: number) {
  return apiFetch<InvoiceItem[]>(`/invoices/${invoiceId}/items`);
}

export function createInvoice(data: {
  folio_id: number;
  notes?: string | null;
}) {
  return apiFetch<Invoice>("/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function finalizeInvoice(invoiceId: number) {
  return apiFetch<Invoice>(`/invoices/${invoiceId}/finalize`, {
    method: "POST",
  });
}

export function voidInvoice(invoiceId: number) {
  return apiFetch<Invoice>(`/invoices/${invoiceId}/void`, {
    method: "POST",
  });
}
