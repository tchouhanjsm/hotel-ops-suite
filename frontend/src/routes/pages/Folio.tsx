import { useEffect, useState } from "react";

import {
  getFolio,
  getFolioItems,
  type Folio as FolioData,
  type FolioItem,
} from "../../api/folio";

const DEFAULT_FOLIO_ID = 1;

const money = (value: string, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));

export default function Folio() {
  const [folioId, setFolioId] = useState(String(DEFAULT_FOLIO_ID));
  const [folio, setFolio] = useState<FolioData | null>(null);
  const [items, setItems] = useState<FolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadFolio() {
    const id = Number(folioId);

    if (!Number.isInteger(id) || id <= 0) {
      setError("Enter a valid folio ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [folioData, itemData] = await Promise.all([
        getFolio(id),
        getFolioItems(id),
      ]);

      setFolio(folioData);
      setItems(itemData);
    } catch (err) {
      setFolio(null);
      setItems([]);
      setError(err instanceof Error ? err.message : "Unable to load folio.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = DEFAULT_FOLIO_ID;
    let cancelled = false;

    Promise.all([getFolio(id), getFolioItems(id)])
      .then(([folioData, itemData]) => {
        if (cancelled) {
          return;
        }

        setFolio(folioData);
        setItems(itemData);
      })
      .catch((err) => {
        if (!cancelled) {
          setFolio(null);
          setItems([]);
          setError(
            err instanceof Error ? err.message : "Unable to load folio.",
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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Folio</h1>
        <p className="text-sm text-gray-500">
          Review charges, taxes, payments, and balance due.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          data-testid="folio-id"
          value={folioId}
          onChange={(event) => setFolioId(event.target.value)}
          className="rounded border px-3 py-2"
          type="number"
          min="1"
          placeholder="Folio ID"
        />
        <button
          type="button"
          data-testid="load-folio"
          onClick={() => void loadFolio()}
          className="rounded bg-black px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Folio"}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {folio && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="mt-1 text-xl font-semibold">
                {money(folio.subtotal, folio.currency)}
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">Tax</div>
              <div className="mt-1 text-xl font-semibold">
                {money(folio.tax_total, folio.currency)}
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">Paid</div>
              <div className="mt-1 text-xl font-semibold">
                {money(folio.paid_amount, folio.currency)}
              </div>
            </div>

            <div className="rounded border p-4">
              <div className="text-sm text-gray-500">Balance Due</div>
              <div className="mt-1 text-xl font-semibold">
                {money(folio.balance_due, folio.currency)}
              </div>
            </div>
          </div>

          <div className="rounded border">
            <div className="border-b p-4">
              <div data-testid="folio-number" className="font-semibold">
                {folio.folio_number}
              </div>
              <div className="text-sm text-gray-500">
                Booking #{folio.booking_id} · {folio.status}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Tax</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div>{item.description}</div>
                        <div className="text-xs text-gray-500">
                          {item.item_type}
                        </div>
                      </td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">
                        {money(item.unit_price, folio.currency)}
                      </td>
                      <td className="px-4 py-3">{item.tax_percent}%</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {money(item.total_amount, folio.currency)}
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No folio items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t p-4">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Grand Total</span>
                  <span>{money(folio.grand_total, folio.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid</span>
                  <span>{money(folio.paid_amount, folio.currency)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Balance Due</span>
                  <span>{money(folio.balance_due, folio.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
