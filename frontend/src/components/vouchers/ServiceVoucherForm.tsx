import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  createServiceVoucher,
  type ServiceVoucher,
} from "../../api/serviceVouchers";
import { getFolio, type Folio } from "../../api/folio";
import Button from "../ui/Button";

type Props = {
  folioId: number;
  onSaved: (voucher: ServiceVoucher) => void;
  onCancel: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  voucher_date: today(),
  service_category: "Guest Services",
  service_name: "",
  description: "",
  quantity: "1.00",
  unit_price: "",
  tax_percent: "0.00",
  notes: "",
});

export default function ServiceVoucherForm({
  folioId,
  onSaved,
  onCancel,
}: Props) {
  const [folio, setFolio] = useState<Folio | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [loadingFolio, setLoadingFolio] = useState(true);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unit_price);
    const taxPercent = Number(form.tax_percent);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(taxPercent) ||
      quantity <= 0 ||
      unitPrice < 0
    ) {
      return null;
    }

    const amount = quantity * unitPrice;
    const tax = amount * (taxPercent / 100);
    const total = amount + tax;

    return { amount, tax, total };
  }, [form.quantity, form.unit_price, form.tax_percent]);

  useEffect(() => {
    let cancelled = false;

    getFolio(folioId)
      .then((data) => {
        if (!cancelled) {
          setFolio(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load folio.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFolio(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [folioId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unit_price);
    const taxPercent = Number(form.tax_percent);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError("Enter a valid unit price.");
      return;
    }

    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      setError("Enter a valid tax percentage.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const voucher = await createServiceVoucher({
        voucher_date: form.voucher_date,
        folio_id: folioId,
        service_category: form.service_category,
        service_name: form.service_name,
        description: form.description,
        quantity: quantity.toFixed(2),
        unit_price: unitPrice.toFixed(2),
        tax_percent: taxPercent.toFixed(2),
        notes: form.notes || null,
      });

      onSaved(voucher);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create service voucher.",
      );
    } finally {
      setSaving(false);
    }
  }

  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: folio?.currency ?? "INR",
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[22px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--hos-border)] px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-[var(--hos-ink)]">
              New Service Voucher
            </div>

            <div className="mt-1 text-sm text-[var(--hos-muted)]">
              {loadingFolio
                ? "Loading folio..."
                : folio
                  ? `${folio.folio_number} · Booking #${folio.booking_id}`
                  : `Folio #${folioId}`}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-5 rounded-2xl border border-[var(--hos-red)]/15 bg-[var(--hos-red-soft)] p-4 text-sm text-[var(--hos-red)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--hos-text)]">
                Voucher Date
              </span>
              <input
                required
                type="date"
                data-testid="service-voucher-date"
                value={form.voucher_date}
                onChange={(event) =>
                  setForm({ ...form, voucher_date: event.target.value })
                }
                className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--hos-text)]">
                Category
              </span>
              <input
                required
                data-testid="service-voucher-category"
                value={form.service_category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    service_category: event.target.value,
                  })
                }
                className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                placeholder="Guest Services"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--hos-text)]">
              Service Name
            </span>
            <input
              required
              data-testid="service-voucher-name"
              value={form.service_name}
              onChange={(event) =>
                setForm({ ...form, service_name: event.target.value })
              }
              className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
              placeholder="Desert Safari"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--hos-text)]">
              Description
            </span>
            <textarea
              required
              rows={3}
              data-testid="service-voucher-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="hos-search w-full rounded-xl px-4 py-3 outline-none"
              placeholder="Evening camel safari"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--hos-text)]">
                Quantity
              </span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                data-testid="service-voucher-quantity"
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
                className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--hos-text)]">
                Unit Price
              </span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                data-testid="service-voucher-unit-price"
                value={form.unit_price}
                onChange={(event) =>
                  setForm({ ...form, unit_price: event.target.value })
                }
                className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                placeholder="850.00"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--hos-text)]">
                Tax %
              </span>
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                data-testid="service-voucher-tax"
                value={form.tax_percent}
                onChange={(event) =>
                  setForm({ ...form, tax_percent: event.target.value })
                }
                className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
              />
            </label>
          </div>

          {preview && (
            <div className="rounded-2xl bg-[var(--hos-surface-soft)] p-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--hos-muted)]">Subtotal</span>
                <span>{money(preview.amount)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-[var(--hos-muted)]">Tax</span>
                <span>{money(preview.tax)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-[var(--hos-border)] pt-3 text-base font-semibold text-[var(--hos-ink)]">
                <span>Total</span>
                <span>{money(preview.total)}</span>
              </div>
            </div>
          )}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[var(--hos-text)]">
              Notes
            </span>
            <textarea
              rows={2}
              data-testid="service-voucher-notes"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              className="hos-search w-full rounded-xl px-4 py-3 outline-none"
              placeholder="Optional notes"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-[var(--hos-border)] pt-5">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={onCancel}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              data-testid="save-service-voucher"
              disabled={saving || loadingFolio}
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
