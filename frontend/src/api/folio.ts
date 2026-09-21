import { apiFetch } from "./client";

export type FolioItem = {
  id: number;
  folio_id: number;
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

export type Folio = {
  id: number;
  folio_number: string;
  booking_id: number;
  status: "open" | "closed" | "void";
  currency: string;
  notes: string | null;
  created_at: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  paid_amount: string;
  balance_due: string;
};

export function getFolio(folioId: number) {
  return apiFetch<Folio>(`/folios/${folioId}`);
}

export function getFolioItems(folioId: number) {
  return apiFetch<FolioItem[]>(`/folios/${folioId}/items`);
}

export function getFolioByBooking(bookingId: number) {
  return apiFetch<Folio>(`/folios/booking/${bookingId}`);
}

export function createFolio(data: {
  booking_id: number;
  currency?: string;
  notes?: string | null;
}) {
  return apiFetch<Folio>("/folios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
