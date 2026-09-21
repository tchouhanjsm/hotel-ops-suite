import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  createInvoice,
  finalizeInvoice,
  getInvoiceItems,
  getInvoices,
  voidInvoice,
  type Invoice,
  type InvoiceItem,
  type InvoiceStatus,
} from "../../api/invoices";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

type Tab = "all" | InvoiceStatus;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All Invoices" },
  { key: "draft", label: "Drafts" },
  { key: "finalized", label: "Finalized" },
  { key: "void", label: "Void" },
];

const STATUS_VARIANTS: Record<
  InvoiceStatus,
  "neutral" | "success" | "warning" | "error"
> = {
  draft: "warning",
  finalized: "success",
  void: "error",
};

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
  }).format(new Date(`${value}T00:00:00`));

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function statusLabel(status: InvoiceStatus) {
  return status === "draft"
    ? "Draft"
    : status === "finalized"
      ? "Finalized"
      : "Void";
}

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folioIdParam = searchParams.get("folioId") ?? "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadedItemsForInvoiceId, setLoadedItemsForInvoiceId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [folioId, setFolioId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedId) ?? null,
    [invoices, selectedId],
  );

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const data = await getInvoices();
      setInvoices(data);

      setSelectedId((current) => {
        if (current !== null && data.some((invoice) => invoice.id === current)) {
          return current;
        }

        return data[0]?.id ?? null;
      });
    } catch (err) {
      setInvoices([]);
      setSelectedId(null);
      setError(
        err instanceof Error ? err.message : "Unable to load invoices.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getInvoices()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setInvoices(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setInvoices([]);
          setSelectedId(null);
          setError(
            err instanceof Error ? err.message : "Unable to load invoices.",
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

  useEffect(() => {
    if (!selectedInvoice) {
      return;
    }

    let cancelled = false;

    getInvoiceItems(selectedInvoice.id)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoadedItemsForInvoiceId(selectedInvoice.id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setItems([]);
          setLoadedItemsForInvoiceId(selectedInvoice.id);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load invoice items.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedInvoice]);


  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesTab = tab === "all" || invoice.status === tab;

      if (!matchesTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        invoice.invoice_number,
        invoice.booking_reference,
        invoice.bill_to_name,
        invoice.bill_to_phone,
        invoice.room_number,
        invoice.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [invoices, search, tab]);

  const stats = useMemo(
    () => ({
      all: invoices.length,
      draft: invoices.filter((invoice) => invoice.status === "draft").length,
      finalized: invoices.filter((invoice) => invoice.status === "finalized")
        .length,
      outstanding: invoices.filter(
        (invoice) =>
          invoice.status !== "void" && Number(invoice.balance_due) > 0,
      ).length,
    }),
    [invoices],
  );

  function openCreate() {
    setError("");
    setMessage("");
    setFolioId(folioIdParam);
    setNotes("");
    setShowCreate(true);
  }

  function closeCreate() {
    if (saving) {
      return;
    }

    setShowCreate(false);
    setFolioId("");

    if (folioIdParam) {
      setSearchParams(
        (current) => {
          current.delete("folioId");
          return current;
        },
        { replace: true },
      );
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericFolioId = Number(folioId || folioIdParam);

    if (!Number.isInteger(numericFolioId) || numericFolioId <= 0) {
      setError("Enter a valid folio ID.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const created = await createInvoice({
        folio_id: numericFolioId,
        notes: notes.trim() || null,
      });

      setInvoices((current) => [created, ...current]);
      setSelectedId(created.id);
      setTab("all");
      setSearch("");
      setItems([]);
      setShowCreate(false);
      setMessage(`Invoice ${created.invoice_number} created as draft.`);
      setFolioId("");
      setNotes("");

      if (folioIdParam) {
        setSearchParams(
          (current) => {
            current.delete("folioId");
            return current;
          },
          { replace: true },
        );
      }

      const createdItems = await getInvoiceItems(created.id);
      setItems(createdItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create invoice.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize(invoice: Invoice) {
    if (!window.confirm(`Finalize ${invoice.invoice_number}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await finalizeInvoice(invoice.id);

      setInvoices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedId(updated.id);
      setMessage(`Invoice ${updated.invoice_number} finalized.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to finalize invoice.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(invoice: Invoice) {
    if (!window.confirm(`Void ${invoice.invoice_number}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await voidInvoice(invoice.id);

      setInvoices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedId(updated.id);
      setMessage(`Invoice ${updated.invoice_number} voided.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to void invoice.");
    } finally {
      setSaving(false);
    }
  }

  const detailLoading =
    selectedInvoice !== null && loadedItemsForInvoiceId !== selectedInvoice.id;

  return (
    <section className="space-y-6">
      <div className="hos-glass relative overflow-hidden rounded-[22px] p-5 sm:p-6 lg:p-7">
        <img
          src="/jaisalmer-fort-landscape.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-40 w-[52%] object-cover object-bottom opacity-[0.18] mix-blend-multiply sm:h-48"
        />

        <div className="relative z-10">
          <PageHeader
            title="Invoices"
            description="Prepare, finalize and track guest invoices from completed stay charges."
            actions={
              <>
                <Button
                  variant="secondary"
                  onClick={() => void loadData()}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  Refresh
                </Button>

                <Button onClick={openCreate}>
                  <Plus size={16} />
                  New Invoice
                </Button>
              </>
            }
          />

          <div className="hidden max-w-xl pt-1 text-sm italic text-[var(--hos-brand-dark)] sm:block">
            Every stay becomes a clear story, right down to the final bill.
          </div>
        </div>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="All Invoices"
          value={stats.all}
          detail="Invoice records"
          icon={FileText}
          tone="neutral"
        />
        <StatCard
          label="Drafts"
          value={stats.draft}
          detail="Ready to finalize"
          icon={FileText}
          tone="warning"
        />
        <StatCard
          label="Finalized"
          value={stats.finalized}
          detail="Issued invoices"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={stats.outstanding}
          detail="Invoices with balance"
          icon={WalletCards}
          tone={stats.outstanding > 0 ? "warning" : "success"}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--hos-border)] px-4 pt-4 sm:px-5">
          <div className="flex flex-wrap gap-1">
            {TABS.map((item) => {
              const active = tab === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={[
                    "rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-[var(--hos-brand-soft)] text-[var(--hos-brand-dark)] shadow-sm"
                      : "text-[var(--hos-muted)] hover:bg-gray-50 hover:text-[var(--hos-ink)]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--hos-border)] py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, guest, booking or room..."
                className="hos-search h-11 w-full rounded-xl pl-10 pr-4 text-sm outline-none"
              />
            </div>

            <Button variant="secondary" size="sm">
              <Filter size={14} />
              Filter
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-[var(--hos-muted)]">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hos-brand-soft)] text-[var(--hos-brand-dark)]">
              <FileText size={24} />
            </div>
            <div className="mt-4 text-sm font-semibold text-[var(--hos-ink)]">
              No invoices found
            </div>
            <div className="mt-1 text-sm text-[var(--hos-muted)]">
              Create an invoice from a folio to get started.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-[var(--hos-border)] bg-gray-50/70">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Invoice
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Guest
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Stay
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Balance
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => {
                  const active = selectedId === invoice.id;

                  return (
                    <tr
                      key={invoice.id}
                      data-testid={`invoice-row-${invoice.id}`}
                      className={[
                        "border-b border-[var(--hos-border)] last:border-0",
                        active ? "bg-[var(--hos-brand-soft)]/35" : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => setSelectedId(invoice.id)}
                        >
                          <div className="font-semibold text-[var(--hos-ink)]">
                            {invoice.invoice_number}
                          </div>
                          <div className="mt-0.5 text-xs text-[var(--hos-muted)]">
                            {invoice.booking_reference} · Room{" "}
                            {invoice.room_number}
                          </div>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hos-brand-soft)] text-xs font-semibold text-[var(--hos-brand-dark)]">
                            {initials(invoice.bill_to_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[var(--hos-ink)]">
                              {invoice.bill_to_name}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--hos-muted)]">
                              {invoice.bill_to_phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-[var(--hos-text)]">
                          {dateLabel(invoice.check_in)} →{" "}
                          {dateLabel(invoice.check_out)}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--hos-muted)]">
                          Folio #{invoice.folio_id}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-[var(--hos-ink)]">
                        {money(invoice.grand_total, invoice.currency)}
                      </td>

                      <td className="px-5 py-4 font-medium text-[var(--hos-text)]">
                        {money(invoice.balance_due, invoice.currency)}
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant={STATUS_VARIANTS[invoice.status]}>
                          {statusLabel(invoice.status)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedId(invoice.id)}
                        >
                          <Eye size={14} />
                          Open
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--hos-border)] px-5 py-4 text-xs text-[var(--hos-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>
          <span>Invoices are snapshots of folio charges.</span>
        </div>
      </Card>

      {selectedInvoice && (
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--hos-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--hos-ink)]">
                    {selectedInvoice.invoice_number}
                  </h2>
                  <Badge variant={STATUS_VARIANTS[selectedInvoice.status]}>
                    {statusLabel(selectedInvoice.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--hos-muted)]">
                  Booking {selectedInvoice.booking_reference} · Folio #
                  {selectedInvoice.folio_id}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/folio?folioId=${selectedInvoice.folio_id}`,
                      "_self",
                    )
                  }
                >
                  <ArrowUpRight size={14} />
                  Open Folio
                </Button>

                {selectedInvoice.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => void handleFinalize(selectedInvoice)}
                    disabled={saving}
                  >
                    <CheckCircle2 size={14} />
                    Finalize
                  </Button>
                )}

                {selectedInvoice.status === "finalized" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void handleVoid(selectedInvoice)}
                    disabled={saving}
                  >
                    <Ban size={14} />
                    Void Invoice
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-[var(--hos-border)] p-5 sm:p-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-[var(--hos-surface-soft)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--hos-subtle)]">
                Bill to
              </div>
              <div className="mt-2 text-sm font-semibold text-[var(--hos-ink)]">
                {selectedInvoice.bill_to_name}
              </div>
              <div className="mt-1 text-sm text-[var(--hos-muted)]">
                {selectedInvoice.bill_to_phone}
              </div>
              {selectedInvoice.bill_to_email && (
                <div className="mt-1 text-sm text-[var(--hos-muted)]">
                  {selectedInvoice.bill_to_email}
                </div>
              )}
              {selectedInvoice.bill_to_address && (
                <div className="mt-2 whitespace-pre-line text-sm text-[var(--hos-muted)]">
                  {selectedInvoice.bill_to_address}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-[var(--hos-surface-soft)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--hos-subtle)]">
                Stay
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--hos-ink)]">
                <CalendarDays size={16} className="text-[var(--hos-brand)]" />
                {dateLabel(selectedInvoice.check_in)} →{" "}
                {dateLabel(selectedInvoice.check_out)}
              </div>
              <div className="mt-2 text-sm text-[var(--hos-muted)]">
                {selectedInvoice.booking_reference} · Room{" "}
                {selectedInvoice.room_number}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-[var(--hos-border)] bg-white/55">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Description
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Qty
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Unit
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Tax
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {detailLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-[var(--hos-muted)]"
                    >
                      Loading invoice items...
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--hos-border)] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-[var(--hos-ink)]">
                          {item.description}
                        </div>
                        <div className="mt-0.5 text-xs capitalize text-[var(--hos-muted)]">
                          {item.item_type}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[var(--hos-text)]">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-[var(--hos-text)]">
                        {money(item.unit_price, selectedInvoice.currency)}
                      </td>
                      <td className="px-5 py-4 text-[var(--hos-text)]">
                        {item.tax_percent}%
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[var(--hos-ink)]">
                        {money(item.total_amount, selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))
                )}

                {!detailLoading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-[var(--hos-muted)]"
                    >
                      No invoice items recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-[var(--hos-border)] bg-white/35 p-5 sm:p-6">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between text-[var(--hos-muted)]">
                <span>Subtotal</span>
                <span>
                  {money(selectedInvoice.subtotal, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--hos-muted)]">
                <span>Tax</span>
                <span>
                  {money(selectedInvoice.tax_total, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--hos-border)] pt-3 font-semibold text-[var(--hos-ink)]">
                <span>Grand Total</span>
                <span>
                  {money(selectedInvoice.grand_total, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--hos-muted)]">
                <span>Paid</span>
                <span>
                  {money(selectedInvoice.paid_amount, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[var(--hos-ink)]">
                <span>Balance Due</span>
                <span>
                  {money(selectedInvoice.balance_due, selectedInvoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {(showCreate || Boolean(folioIdParam.trim())) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreate();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] bg-white shadow-2xl">
            <div className="border-b border-[var(--hos-border)] px-6 py-5">
              <div className="text-lg font-semibold text-[var(--hos-ink)]">
                New Invoice
              </div>
              <div className="mt-1 text-sm text-[var(--hos-muted)]">
                Create a draft invoice from an existing folio snapshot.
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-6">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[var(--hos-text)]">
                  Folio ID
                </span>
                <input
                  required
                  data-testid="invoice-folio-id"
                  inputMode="numeric"
                        value={folioId || folioIdParam}
                  onChange={(event) => setFolioId(event.target.value)}
                  placeholder="e.g. 12"
                  className="hos-search min-h-11 w-full rounded-xl px-4 outline-none"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[var(--hos-text)]">
                  Notes
                </span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional invoice notes"
                  className="hos-search w-full rounded-xl px-4 py-3 outline-none"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-[var(--hos-border)] pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeCreate}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Plus size={15} />
                  {saving ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
