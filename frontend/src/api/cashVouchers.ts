import { apiFetch } from "./client";

export type CashVoucherStatus = "active" | "cancelled";

export type CashVoucher = {
  id: number;
  voucher_number: string;
  voucher_date: string;
  payee_name: string;
  expense_category: string;
  description: string;
  amount: string;
  currency: string;
  status: CashVoucherStatus;
  external_reference: string | null;
  notes: string | null;
  created_by: number;
  updated_by: number | null;
  cancelled_by: number | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CashVoucherCreate = {
  voucher_date: string;
  payee_name: string;
  expense_category: string;
  description: string;
  amount: number;
  currency?: string;
  external_reference?: string | null;
  notes?: string | null;
};

export type CashVoucherUpdate = Partial<CashVoucherCreate>;

export function getCashVouchers(status?: CashVoucherStatus) {
  const query = status ? "?voucher_status=" + encodeURIComponent(status) : "";
  return apiFetch<CashVoucher[]>("/cash-vouchers" + query);
}

export function getCashVoucher(voucherId: number) {
  return apiFetch<CashVoucher>("/cash-vouchers/" + voucherId);
}

export function createCashVoucher(data: CashVoucherCreate) {
  return apiFetch<CashVoucher>("/cash-vouchers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCashVoucher(
  voucherId: number,
  data: CashVoucherUpdate,
) {
  return apiFetch<CashVoucher>("/cash-vouchers/" + voucherId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function cancelCashVoucher(voucherId: number) {
  return apiFetch<CashVoucher>("/cash-vouchers/" + voucherId + "/cancel", {
    method: "POST",
  });
}
