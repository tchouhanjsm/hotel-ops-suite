import { apiFetch } from "./client";

export type ServiceVoucherStatus = "draft" | "issued" | "cancelled";

export type ServiceVoucher = {
  id: number;
  voucher_number: string;
  voucher_date: string;
  folio_id: number;
  folio_item_id: number | null;
  service_category: string;
  service_name: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_percent: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: ServiceVoucherStatus;
  notes: string | null;
  created_by: number;
  issued_by: number | null;
  issued_at: string | null;
  cancelled_by: number | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceVoucherCreate = {
  voucher_date: string;
  folio_id: number;
  service_category: string;
  service_name: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_percent: string;
  notes?: string | null;
};

export type ServiceVoucherUpdate = Partial<
  Omit<ServiceVoucherCreate, "folio_id">
>;

export function getServiceVouchers(status?: ServiceVoucherStatus) {
  const query = status
    ? "?voucher_status=" + encodeURIComponent(status)
    : "";

  return apiFetch<ServiceVoucher[]>("/service-vouchers" + query);
}

export function getServiceVoucher(voucherId: number) {
  return apiFetch<ServiceVoucher>(`/service-vouchers/${voucherId}`);
}

export function createServiceVoucher(data: ServiceVoucherCreate) {
  return apiFetch<ServiceVoucher>("/service-vouchers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateServiceVoucher(
  voucherId: number,
  data: ServiceVoucherUpdate,
) {
  return apiFetch<ServiceVoucher>(`/service-vouchers/${voucherId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function issueServiceVoucher(voucherId: number) {
  return apiFetch<ServiceVoucher>(
    `/service-vouchers/${voucherId}/issue`,
    {
      method: "POST",
    },
  );
}

export function cancelServiceVoucher(voucherId: number) {
  return apiFetch<ServiceVoucher>(
    `/service-vouchers/${voucherId}/cancel`,
    {
      method: "POST",
    },
  );
}
