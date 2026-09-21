import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Receipt } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  createPayment,
  getPayments,
  voidPayment,
  type Payment,
  type PaymentMethod,
} from "../../api/payments";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value));

const methods: PaymentMethod[] = [
  "cash",
  "card",
  "upi",
  "bank_transfer",
  "other",
];

export default function Payments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const folioIdParam = searchParams.get("folioId") ?? "";
  const parsedFolioId = Number(folioIdParam);
  const hasFolioContext = Number.isInteger(parsedFolioId) && parsedFolioId > 0;

  const [folioId, setFolioId] = useState(folioIdParam);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [externalReference, setExternalReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(hasFolioContext);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPayments(preserveMessage = false) {
    const id = Number(folioId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid folio ID.");
      return;
    }

    setLoading(true);
    setError("");

    if (!preserveMessage) {
      setMessage("");
    }

    try {
      setPayments(await getPayments(id));
    } catch (err) {
      setPayments([]);
      setError(err instanceof Error ? err.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasFolioContext) {
      return;
    }

    let cancelled = false;

    getPayments(parsedFolioId)
      .then((data) => {
        if (!cancelled) {
          setPayments(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPayments([]);
          setError(
            err instanceof Error ? err.message : "Unable to load payments.",
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
  }, [hasFolioContext, parsedFolioId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = Number(folioId);
    const numericAmount = Number(amount);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid folio ID.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createPayment({
        folio_id: id,
        amount: numericAmount,
        payment_method: method,
        external_reference: externalReference || null,
        notes: notes || null,
      });

      setAmount("");
      setExternalReference("");
      setNotes("");
      setMessage("Payment recorded.");
      await loadPayments(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to record payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(paymentId: number) {
    setError("");
    setMessage("");

    try {
      await voidPayment(paymentId);
      setMessage("Payment voided.");
      await loadPayments(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to void payment.");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Payments"
        description={
          hasFolioContext
            ? `Payment activity for Folio #${parsedFolioId}.`
            : "Record and manage payments against a folio."
        }
        actions={
          hasFolioContext ? (
            <Button
              variant="secondary"
              onClick={() => navigate(`/folio?folioId=${parsedFolioId}`)}
            >
              <ArrowLeft size={16} />
              Back to folio
            </Button>
          ) : undefined
        }
      />

      {!hasFolioContext && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              data-testid="payments-folio-id"
              className="hos-search min-h-11 flex-1 rounded-xl px-4 text-sm outline-none"
              type="number"
              min="1"
              value={folioId}
              onChange={(event) => setFolioId(event.target.value)}
              placeholder="Folio ID"
            />

            <Button
              variant="secondary"
              onClick={() => void loadPayments()}
              disabled={loading}
              data-testid="load-payments"
            >
              {loading ? "Loading..." : "Load Payments"}
            </Button>
          </div>
        </Card>
      )}

      {hasFolioContext && (
        <div className="hos-ai-entry flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[var(--hos-brand-dark)]">
            <Receipt size={19} />
          </div>

          <div>
            <div className="text-sm font-semibold text-[var(--hos-ink)]">
              Folio #{parsedFolioId}
            </div>
            <div className="text-xs text-[var(--hos-muted)]">
              Payments recorded here are applied directly to this folio.
            </div>
          </div>
        </div>
      )}

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

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hos-brand-soft)] text-[var(--hos-brand-dark)]">
            <CreditCard size={19} />
          </div>

          <div>
            <h2 className="hos-section-title">Record payment</h2>
            <p className="hos-section-description">
              Add a payment against the current folio.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <input
            data-testid="payment-amount"
            className="hos-search min-h-11 rounded-xl px-4 text-sm outline-none"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            required
          />

          <select
            data-testid="payment-method"
            className="hos-search min-h-11 rounded-xl px-4 text-sm outline-none"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            {methods.map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </select>

          <input
            className="hos-search min-h-11 rounded-xl px-4 text-sm outline-none"
            value={externalReference}
            onChange={(event) => setExternalReference(event.target.value)}
            placeholder="External reference"
          />

          <input
            className="hos-search min-h-11 rounded-xl px-4 text-sm outline-none"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
          />

          <div>
            <Button
              type="submit"
              disabled={saving}
              data-testid="record-payment"
            >
              <CreditCard size={16} />
              {saving ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--hos-border)] px-5 py-4">
          <div>
            <div className="hos-section-title">Payment history</div>
            <div className="hos-section-description">
              Completed and voided payments for this folio.
            </div>
          </div>

          <span className="text-xs text-[var(--hos-muted)]">
            {payments.length} payment{payments.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--hos-muted)]">
            Loading payments...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--hos-border)] bg-white/50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Reference
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Method
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500">
                    Received
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500" />
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    data-testid={`payment-row-${payment.id}`}
                    className="border-b border-[var(--hos-border)] last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-[var(--hos-ink)]">
                      {payment.payment_reference}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[var(--hos-ink)]">
                      {money(payment.amount)}
                    </td>

                    <td className="px-5 py-4 capitalize text-gray-600">
                      {payment.payment_method.replace("_", " ")}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          payment.status === "completed" ? "success" : "neutral"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {new Date(payment.received_at).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {payment.status === "completed" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void handleVoid(payment.id)}
                          data-testid={`void-payment-${payment.id}`}
                        >
                          Void
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-[var(--hos-muted)]"
                    >
                      No payments found for this folio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
