import { useState } from "react";

import {
  createPayment,
  getPayments,
  voidPayment,
  type Payment,
  type PaymentMethod,
} from "../../api/payments";

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
  const [folioId, setFolioId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [externalReference, setExternalReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
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
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-gray-500">
          Record and manage payments against a folio.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          data-testid="payments-folio-id"
          className="rounded border px-3 py-2"
          type="number"
          min="1"
          value={folioId}
          onChange={(event) => setFolioId(event.target.value)}
          placeholder="Folio ID"
        />
        <button
          type="button"
          data-testid="load-payments"
          onClick={() => void loadPayments()}
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load Payments"}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="rounded border p-5">
        <h2 className="font-semibold">Record Payment</h2>

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <input
            data-testid="payment-amount"
            className="rounded border px-3 py-2"
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
            className="rounded border px-3 py-2"
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
            className="rounded border px-3 py-2"
            value={externalReference}
            onChange={(event) => setExternalReference(event.target.value)}
            placeholder="External reference"
          />

          <input
            className="rounded border px-3 py-2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
          />

          <div>
            <button
              type="submit"
              data-testid="record-payment"
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded border">
        <div className="border-b p-4 font-semibold">Payment History</div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  data-testid={`payment-row-${payment.id}`}
                  className="border-b last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {payment.payment_reference}
                  </td>
                  <td className="px-4 py-3">{money(payment.amount)}</td>
                  <td className="px-4 py-3">
                    {payment.payment_method.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3">
                    {new Date(payment.received_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === "completed" && (
                      <button
                        type="button"
                        data-testid={`void-payment-${payment.id}`}
                        onClick={() => void handleVoid(payment.id)}
                        className="rounded border px-3 py-1 text-sm"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
