import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";

import {
  cancelCashVoucher,
  createCashVoucher,
  getCashVouchers,
  updateCashVoucher,
  type CashVoucher,
  type CashVoucherStatus,
} from "../../api/cashVouchers";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

type Tab = "all" | CashVoucherStatus;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "cancelled", label: "Cancelled" },
];

const CATEGORIES = [
  "Petty Cash",
  "Transport",
  "Food & Refreshments",
  "Maintenance",
  "Supplies",
  "Utilities",
  "Staff",
  "Guest Services",
  "Other",
];

const money = (value: string | number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value + "T00:00:00"));

const statusVariant: Record<CashVoucherStatus, "success" | "error"> = {
  active: "success",
  cancelled: "error",
};

const emptyForm = () => ({
  voucher_date: new Date().toISOString().slice(0, 10),
  payee_name: "",
  expense_category: "Petty Cash",
  description: "",
  amount: "",
  external_reference: "",
  notes: "",
});

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());

  const selectedVoucher = useMemo(
    () => vouchers.find((item) => item.id === selectedId) ?? null,
    [vouchers, selectedId],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return vouchers.filter((voucher) => {
      const matchesTab = tab === "all" || voucher.status === tab;
      const haystack = [
        voucher.voucher_number,
        voucher.payee_name,
        voucher.expense_category,
        voucher.description,
      ]
        .join(" ")
        .toLowerCase();

      return matchesTab && (!needle || haystack.includes(needle));
    });
  }, [search, tab, vouchers]);

  const activeVouchers = vouchers.filter((item) => item.status === "active");
  const cancelledVouchers = vouchers.filter(
    (item) => item.status === "cancelled",
  );
  const activeTotal = activeVouchers.reduce(
    (sum, voucher) => sum + Number(voucher.amount),
    0,
  );
  const cancelledTotal = cancelledVouchers.reduce(
    (sum, voucher) => sum + Number(voucher.amount),
    0,
  );
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = activeVouchers
    .filter((voucher) => voucher.voucher_date === today)
    .reduce((sum, voucher) => sum + Number(voucher.amount), 0);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const data = await getCashVouchers();
      setVouchers(data);
      setSelectedId((current) =>
        current !== null && data.some((voucher) => voucher.id === current)
          ? current
          : data[0]?.id ?? null,
      );
    } catch (err) {
      setVouchers([]);
      setSelectedId(null);
      setError(
        err instanceof Error ? err.message : "Unable to load cash vouchers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getCashVouchers()
      .then((data) => {
        if (!cancelled) {
          setVouchers(data);
          setSelectedId(data[0]?.id ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load cash vouchers.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setForm(emptyForm());
    setEditingId(null);
    setShowModal(true);
    setError("");
    setMessage("");
  }

  function openEdit(voucher: CashVoucher) {
    setForm({
      voucher_date: voucher.voucher_date,
      payee_name: voucher.payee_name,
      expense_category: voucher.expense_category,
      description: voucher.description,
      amount: String(voucher.amount),
      external_reference: voucher.external_reference ?? "",
      notes: voucher.notes ?? "",
    });
    setEditingId(voucher.id);
    setShowModal(true);
    setError("");
    setMessage("");
  }

  function closeModal() {
    if (!saving) {
      setShowModal(false);
      setEditingId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId !== null) {
        const updated = await updateCashVoucher(editingId, {
          voucher_date: form.voucher_date,
          payee_name: form.payee_name,
          expense_category: form.expense_category,
          description: form.description,
          amount,
          external_reference: form.external_reference || null,
          notes: form.notes || null,
        });

        setVouchers((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setSelectedId(updated.id);
        setMessage("Cash voucher updated.");
      } else {
        const created = await createCashVoucher({
          voucher_date: form.voucher_date,
          payee_name: form.payee_name,
          expense_category: form.expense_category,
          description: form.description,
          amount,
          external_reference: form.external_reference || null,
          notes: form.notes || null,
        });

        setVouchers((current) => [created, ...current]);
        setSelectedId(created.id);
        setMessage("Cash voucher created.");
      }

      setForm(emptyForm());
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save cash voucher.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(voucher: CashVoucher) {
    if (!window.confirm("Cancel " + voucher.voucher_number + "?")) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await cancelCashVoucher(voucher.id);
      setVouchers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedId(updated.id);
      setMessage("Cash voucher cancelled.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel cash voucher.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Cash Vouchers"
        description="Record hotel expenses paid from cash."
        actions={
          <>
            <Button variant="secondary" onClick={() => void loadData()}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus size={15} />
              New Cash Voucher
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-2xl border border-[var(--hos-red)]/15 bg-[var(--hos-red-soft)] p-4 text-sm text-[var(--hos-red)]">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-[var(--hos-green)]/15 bg-[var(--hos-green-soft)] p-4 text-sm text-[#28704f]">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active Expenses"
          value={money(activeTotal)}
          detail={activeVouchers.length + " active vouchers"}
          icon={WalletCards}
          tone="warning"
        />
        <StatCard
          label="Today's Cash Out"
          value={money(todayTotal)}
          detail={today}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Cancelled"
          value={money(cancelledTotal)}
          detail={cancelledVouchers.length + " retained for history"}
          icon={CalendarDays}
          tone="info"
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-2xl bg-[var(--hos-surface-soft)] p-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  tab === item.key
                    ? "bg-white text-[var(--hos-ink)] shadow-sm"
                    : "text-[var(--hos-muted)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="hos-search flex min-h-11 items-center gap-2 rounded-xl px-3 sm:min-w-80">
            <Search size={16} className="text-[var(--hos-subtle)]" />
            <input
              data-testid="voucher-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search voucher, payee or category"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="overflow-hidden">
          {loading ? (
            <div className="px-5 py-14 text-center text-sm text-[var(--hos-muted)]">
              Loading cash vouchers...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[var(--hos-border)] bg-white/55">
                  <tr>
                    <th className="px-5 py-3 font-medium text-gray-500">Voucher</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Payee</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Category</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((voucher) => (
                    <tr
                      key={voucher.id}
                      data-testid={"cash-voucher-row-" + voucher.id}
                      className={[
                        "cursor-pointer border-b border-[var(--hos-border)] transition last:border-0 hover:bg-white/55",
                        selectedId === voucher.id ? "bg-white/75" : "",
                      ].join(" ")}
                      onClick={() => setSelectedId(voucher.id)}
                    >
                      <td className="px-5 py-4 font-semibold text-[var(--hos-ink)]">
                        {voucher.voucher_number}
                      </td>
                      <td className="px-5 py-4 text-[var(--hos-muted)]">
                        {dateLabel(voucher.voucher_date)}
                      </td>
                      <td className="px-5 py-4 font-medium text-[var(--hos-text)]">
                        {voucher.payee_name}
                      </td>
                      <td className="px-5 py-4 text-[var(--hos-muted)]">
                        {voucher.expense_category}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[var(--hos-ink)]">
                        {money(voucher.amount, voucher.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant[voucher.status]}>
                          {voucher.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(voucher.id);
                          }}
                        >
                          <Eye size={14} />
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-[var(--hos-muted)]"
                      >
                        No cash vouchers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selectedVoucher ? (
          <Card
            className="h-fit overflow-hidden"
            data-testid="cash-voucher-detail"
          >
            <div className="border-b border-[var(--hos-border)] px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText
                      size={18}
                      className="text-[var(--hos-brand-dark)]"
                    />
                    <h2 className="text-lg font-semibold text-[var(--hos-ink)]">
                      {selectedVoucher.voucher_number}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[var(--hos-muted)]">
                    Cash expense voucher
                  </p>
                </div>

                <Badge variant={statusVariant[selectedVoucher.status]}>
                  {selectedVoucher.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl bg-[var(--hos-surface-soft)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--hos-subtle)]">
                  Paid to
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--hos-ink)]">
                  {selectedVoucher.payee_name}
                </div>
                <div className="mt-1 text-xs text-[var(--hos-muted)]">
                  {selectedVoucher.expense_category}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">Date</div>
                  <div className="mt-1 text-sm font-medium">
                    {dateLabel(selectedVoucher.voucher_date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">Amount</div>
                  <div className="mt-1 text-lg font-semibold text-[var(--hos-ink)]">
                    {money(selectedVoucher.amount, selectedVoucher.currency)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--hos-muted)]">Description</div>
                <div className="mt-1 text-sm leading-6 text-[var(--hos-text)]">
                  {selectedVoucher.description}
                </div>
              </div>

              {selectedVoucher.external_reference && (
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">Reference</div>
                  <div className="mt-1 text-sm text-[var(--hos-text)]">
                    {selectedVoucher.external_reference}
                  </div>
                </div>
              )}

              {selectedVoucher.notes && (
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">Notes</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-[var(--hos-text)]">
                    {selectedVoucher.notes}
                  </div>
                </div>
              )}

              {selectedVoucher.status === "active" && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={saving}
                    onClick={() => openEdit(selectedVoucher)}
                  >
                    <Edit3 size={15} />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={saving}
                    onClick={() => void handleCancel(selectedVoucher)}
                    data-testid={
                      "cancel-cash-voucher-" + selectedVoucher.id
                    }
                  >
                    <Ban size={15} />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="h-fit p-8 text-center text-sm text-[var(--hos-muted)]">
            Select a voucher to inspect its details.
          </Card>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-[22px] bg-white shadow-2xl">
            <div className="border-b border-[var(--hos-border)] px-6 py-5">
              <div className="text-lg font-semibold text-[var(--hos-ink)]">
                {editingId !== null ? "Edit Cash Voucher" : "New Cash Voucher"}
              </div>
              <div className="mt-1 text-sm text-[var(--hos-muted)]">
                Record a hotel expense paid from cash.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[var(--hos-text)]">Date</span>
                  <input
                    required
                    type="date"
                    value={form.voucher_date}
                    onChange={(event) =>
                      setForm({ ...form, voucher_date: event.target.value })
                    }
                    className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[var(--hos-text)]">Amount</span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    data-testid="cash-voucher-amount"
                    className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[var(--hos-text)]">Paid To</span>
                  <input
                    required
                    value={form.payee_name}
                    onChange={(event) =>
                      setForm({ ...form, payee_name: event.target.value })
                    }
                    data-testid="cash-voucher-payee"
                    className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                    placeholder="Vendor or payee"
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[var(--hos-text)]">
                    Expense Category
                  </span>
                  <select
                    value={form.expense_category}
                    onChange={(event) =>
                      setForm({ ...form, expense_category: event.target.value })
                    }
                    data-testid="cash-voucher-category"
                    className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[var(--hos-text)]">
                  Description
                </span>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  data-testid="cash-voucher-description"
                  className="hos-search w-full rounded-xl px-4 py-3 outline-none"
                  placeholder="What was the cash spent on?"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[var(--hos-text)]">
                    External Reference
                  </span>
                  <input
                    value={form.external_reference}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        external_reference: event.target.value,
                      })
                    }
                    className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                    placeholder="Bill or receipt reference"
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[var(--hos-text)]">Notes</span>
                  <input
                    value={form.notes}
                    onChange={(event) =>
                      setForm({ ...form, notes: event.target.value })
                    }
                    className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                    placeholder="Optional notes"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--hos-border)] pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Plus size={15} />
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Save Cash Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
