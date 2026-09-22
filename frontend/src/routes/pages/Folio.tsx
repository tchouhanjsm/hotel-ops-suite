import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Plus,
  WalletCards,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  createFolio,
  getFolio,
  getFolioByBooking,
  getFolioItems,
  type Folio as FolioData,
  type FolioItem,
} from "../../api/folio";
import {
  getInvoiceByFolio,
  type Invoice,
} from "../../api/invoices";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

const money = (value: string, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));

export default function Folio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingIdParam = searchParams.get("bookingId");
  const folioIdParam = searchParams.get("folioId");

  const bookingId = Number(bookingIdParam);
  const folioId = Number(folioIdParam);

  const hasBookingContext = Number.isInteger(bookingId) && bookingId > 0;

  const hasFolioContext = Number.isInteger(folioId) && folioId > 0;

  const [folio, setFolio] = useState<FolioData | null>(null);
  const [items, setItems] = useState<FolioItem[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [needsCreate, setNeedsCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!hasBookingContext && !hasFolioContext) {
      return () => {
        cancelled = true;
      };
    }

    const request = hasFolioContext
      ? getFolio(folioId)
      : getFolioByBooking(bookingId);

    request
      .then(async (folioData) => {
        const invoiceRequest = getInvoiceByFolio(folioData.id).catch((err) => {
          if (err instanceof Error && err.message === "Invoice not found.") {
            return null;
          }

          throw err;
        });

        const [itemData, invoiceData] = await Promise.all([
          getFolioItems(folioData.id),
          invoiceRequest,
        ]);

        if (cancelled) {
          return;
        }

        setFolio(folioData);
        setItems(itemData);
        setInvoice(invoiceData);
        setNeedsCreate(false);
        setError("");
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        if (
          hasBookingContext &&
          err instanceof Error &&
          err.message === "Folio not found."
        ) {
          setFolio(null);
          setItems([]);
          setInvoice(null);
          setNeedsCreate(true);
          setError("");
          return;
        }

        setFolio(null);
        setItems([]);
        setInvoice(null);
        setNeedsCreate(false);
        setError(err instanceof Error ? err.message : "Unable to load folio.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId, folioId, hasBookingContext, hasFolioContext]);

  async function handleCreateFolio() {
    if (!hasBookingContext) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      const created = await createFolio({
        booking_id: bookingId,
        currency: "INR",
      });

      const itemData = await getFolioItems(created.id);

      setFolio(created);
      setItems(itemData);
      setInvoice(null);
      setNeedsCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create folio.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Folio"
        description={
          folio
            ? `Billing workspace for booking #${folio.booking_id}.`
            : "Charges, payments and balance for a guest stay."
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/bookings")}>
              <ArrowLeft size={16} />
              Back to bookings
            </Button>

            {folio && (
              <>
                {invoice ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/invoices?invoiceId=${invoice.id}`)
                    }
                  >
                    <FileText size={16} />
                    Open Invoice
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/invoices?folioId=${folio.id}`)
                    }
                  >
                    <FileText size={16} />
                    Create Invoice
                  </Button>
                )}

                <Button onClick={() => navigate(`/payments?folioId=${folio.id}`)}>
                  <CreditCard size={16} />
                  Payments
                </Button>
              </>
            )}
          </>
        }
      />

      {error && (
        <div className="rounded-2xl border border-[var(--hos-red)]/15 bg-[var(--hos-red-soft)] p-4 text-sm text-[var(--hos-red)]">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="p-8">
          <div className="text-sm text-[var(--hos-muted)]">
            Loading folio...
          </div>
        </Card>
      ) : !hasBookingContext && !hasFolioContext ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hos-brand-soft)] text-[var(--hos-brand-dark)]">
            <WalletCards size={24} />
          </div>

          <h2 className="mt-4 text-base font-semibold text-[var(--hos-ink)]">
            Open a folio from a booking
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--hos-muted)]">
            Select a booking first so the folio is automatically connected to
            the guest stay.
          </p>

          <Button className="mt-5" onClick={() => navigate("/bookings")}>
            View bookings
          </Button>
        </Card>
      ) : needsCreate ? (
        <Card className="p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--hos-ink)]">
                No folio exists for booking #{bookingId}
              </div>
              <div className="mt-1 text-sm text-[var(--hos-muted)]">
                Create the folio to start tracking the stay charges and
                payments.
              </div>
            </div>

            <Button
              onClick={() => void handleCreateFolio()}
              disabled={creating}
            >
              <Plus size={16} />
              {creating ? "Creating..." : "Create Folio"}
            </Button>
          </div>
        </Card>
      ) : (
        folio && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Subtotal"
                value={money(folio.subtotal, folio.currency)}
                icon={WalletCards}
              />

              <StatCard
                label="Tax"
                value={money(folio.tax_total, folio.currency)}
                icon={WalletCards}
                tone="info"
              />

              <StatCard
                label="Paid"
                value={money(folio.paid_amount, folio.currency)}
                icon={CreditCard}
                tone="success"
              />

              <StatCard
                label="Balance Due"
                value={money(folio.balance_due, folio.currency)}
                icon={WalletCards}
                tone={Number(folio.balance_due) > 0 ? "warning" : "success"}
              />
            </div>

            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[var(--hos-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div
                    data-testid="folio-number"
                    className="text-base font-semibold text-[var(--hos-ink)]"
                  >
                    {folio.folio_number}
                  </div>
                  <div className="mt-1 text-xs text-[var(--hos-muted)]">
                    Booking #{folio.booking_id} · {folio.status}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate(`/payments?folioId=${folio.id}`)}
                >
                  <CreditCard size={14} />
                  Record payment
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--hos-border)] bg-white/60">
                    <tr>
                      <th className="px-5 py-3 font-medium text-gray-500">
                        Description
                      </th>
                      <th className="px-5 py-3 font-medium text-gray-500">
                        Qty
                      </th>
                      <th className="px-5 py-3 font-medium text-gray-500">
                        Unit Price
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
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--hos-border)] last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-[var(--hos-ink)]">
                            {item.description}
                          </div>
                          <div className="mt-0.5 text-xs text-[var(--hos-muted)]">
                            {item.item_type}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.quantity}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {money(item.unit_price, folio.currency)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.tax_percent}%
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-[var(--hos-ink)]">
                          {money(item.total_amount, folio.currency)}
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-sm text-[var(--hos-muted)]"
                        >
                          No folio items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-[var(--hos-border)] bg-white/40 p-5">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Grand Total</span>
                    <span className="text-[var(--hos-text)]">
                      {money(folio.grand_total, folio.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500">
                    <span>Paid</span>
                    <span className="text-[var(--hos-text)]">
                      {money(folio.paid_amount, folio.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[var(--hos-border)] pt-3 font-semibold text-[var(--hos-ink)]">
                    <span>Balance Due</span>
                    <span>{money(folio.balance_due, folio.currency)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )
      )}
    </section>
  );
}
