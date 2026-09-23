import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  getServiceVouchers,
  type ServiceVoucher,
  type ServiceVoucherStatus,
} from "../../api/serviceVouchers";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import ServiceVoucherForm from "./ServiceVoucherForm";

type Tab = "all" | ServiceVoucherStatus;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "issued", label: "Issued" },
  { key: "cancelled", label: "Cancelled" },
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

const statusVariant: Record<
  ServiceVoucherStatus,
  "success" | "warning" | "error"
> = {
  draft: "warning",
  issued: "success",
  cancelled: "error",
};

export default function ServiceVoucherWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vouchers, setVouchers] = useState<ServiceVoucher[]>([]);
  const requestVersion = useRef(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const folioIdParam = Number(searchParams.get("folioId"));
  const hasFolioContext =
    Number.isInteger(folioIdParam) && folioIdParam > 0;
  const creating =
    searchParams.get("action") === "create" && hasFolioContext;

  const selectedVoucher = useMemo(
    () => vouchers.find((item) => item.id === selectedId) ?? null,
    [selectedId, vouchers],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return vouchers.filter((voucher) => {
      const matchesTab = tab === "all" || voucher.status === tab;

      const haystack = [
        voucher.voucher_number,
        voucher.service_category,
        voucher.service_name,
        voucher.description,
        String(voucher.folio_id),
      ]
        .join(" ")
        .toLowerCase();

      return matchesTab && (!needle || haystack.includes(needle));
    });
  }, [search, tab, vouchers]);

  const draftVouchers = vouchers.filter((item) => item.status === "draft");
  const issuedVouchers = vouchers.filter((item) => item.status === "issued");
  const cancelledVouchers = vouchers.filter(
    (item) => item.status === "cancelled",
  );

  const issuedTotal = issuedVouchers.reduce(
    (sum, voucher) => sum + Number(voucher.total_amount),
    0,
  );

  async function loadData() {
    const version = ++requestVersion.current;

    setLoading(true);
    setError("");

    try {
      const data = await getServiceVouchers();

      if (version !== requestVersion.current) return;

      setVouchers(data);
      setSelectedId((current) =>
        current !== null && data.some((voucher) => voucher.id === current)
          ? current
          : data[0]?.id ?? null,
      );
    } catch (err) {
      if (version !== requestVersion.current) return;

      setVouchers([]);
      setSelectedId(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load service vouchers.",
      );
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    const version = ++requestVersion.current;

    getServiceVouchers()
      .then((data) => {
        if (cancelled || version !== requestVersion.current) return;

        setVouchers(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled || version !== requestVersion.current) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load service vouchers.",
        );
      })
      .finally(() => {
        if (!cancelled && version === requestVersion.current) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    if (!hasFolioContext) {
      setError("Open a folio before creating a service voucher.");
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("tab", "service");
    next.set("action", "create");
    setSearchParams(next);
    setError("");
  }

  function closeCreate() {
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    setSearchParams(next);
  }

  function handleCreated(voucher: ServiceVoucher) {
    setSelectedId(voucher.id);
    closeCreate();
    void loadData();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Service Vouchers"
        description="Create and manage guest-facing service charges linked to a folio."
        actions={
          <>
            <Button variant="secondary" onClick={() => void loadData()}>
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus size={15} />
              New Service Voucher
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-2xl border border-[var(--hos-red)]/15 bg-[var(--hos-red-soft)] p-4 text-sm text-[var(--hos-red)]">
          {error}
        </div>
      )}

      {!hasFolioContext && (
        <div className="rounded-2xl border border-[var(--hos-border)] bg-[var(--hos-surface-soft)] p-4 text-sm text-[var(--hos-muted)]">
          Service Vouchers are linked to guest folios. Open a folio first to
          create a new service voucher.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Draft"
          value={String(draftVouchers.length)}
          detail="Awaiting issue"
          icon={FileText}
          tone="warning"
        />
        <StatCard
          label="Issued"
          value={String(issuedVouchers.length)}
          detail={money(issuedTotal)}
          icon={FileText}
          tone="success"
        />
        <StatCard
          label="Cancelled"
          value={String(cancelledVouchers.length)}
          detail="Retained for history"
          icon={FileText}
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
                    : "text-[var(--hos-muted)] hover:text-[var(--hos-text)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="hos-search flex min-h-11 items-center gap-2 rounded-xl px-3 sm:min-w-80">
            <Search size={16} className="text-[var(--hos-subtle)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search voucher, service or folio"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="overflow-hidden">
          {loading ? (
            <div className="px-5 py-14 text-center text-sm text-[var(--hos-muted)]">
              Loading service vouchers...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[var(--hos-border)] bg-white/55">
                  <tr>
                    <th className="px-5 py-3 font-medium text-gray-500">
                      Voucher
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-500">
                      Folio
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-500">
                      Service
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">
                      Total
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">
                      Open
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((voucher) => (
                    <tr
                      key={voucher.id}
                      data-testid={`service-voucher-row-${voucher.id}`}
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
                      <td className="px-5 py-4 text-[var(--hos-muted)]">
                        #{voucher.folio_id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-[var(--hos-text)]">
                          {voucher.service_name}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--hos-muted)]">
                          {voucher.service_category}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[var(--hos-ink)]">
                        {money(voucher.total_amount, voucher.currency)}
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
                        No service vouchers found.
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
            data-testid="service-voucher-detail"
            className="h-fit overflow-hidden"
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
                    Guest service charge
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
                  Folio
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--hos-ink)]">
                  #{selectedVoucher.folio_id}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--hos-muted)]">Service</div>
                <div className="mt-1 text-sm font-semibold text-[var(--hos-ink)]">
                  {selectedVoucher.service_name}
                </div>
                <div className="mt-1 text-xs text-[var(--hos-muted)]">
                  {selectedVoucher.service_category}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--hos-muted)]">
                  Description
                </div>
                <div className="mt-1 text-sm leading-6 text-[var(--hos-text)]">
                  {selectedVoucher.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">
                    Quantity
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {selectedVoucher.quantity}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">
                    Unit Price
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {money(
                      selectedVoucher.unit_price,
                      selectedVoucher.currency,
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--hos-border)] pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--hos-muted)]">Subtotal</span>
                  <span>
                    {money(
                      selectedVoucher.amount,
                      selectedVoucher.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--hos-muted)]">
                    Tax ({selectedVoucher.tax_percent}%)
                  </span>
                  <span>
                    {money(
                      selectedVoucher.tax_amount,
                      selectedVoucher.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[var(--hos-ink)]">
                  <span>Total</span>
                  <span>
                    {money(
                      selectedVoucher.total_amount,
                      selectedVoucher.currency,
                    )}
                  </span>
                </div>
              </div>

              {selectedVoucher.notes && (
                <div>
                  <div className="text-xs text-[var(--hos-muted)]">Notes</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-[var(--hos-text)]">
                    {selectedVoucher.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="h-fit p-8 text-center text-sm text-[var(--hos-muted)]">
            Select a service voucher to inspect its details.
          </Card>
        )}
      </div>

      {creating && (
        <ServiceVoucherForm
          folioId={folioIdParam}
          onSaved={handleCreated}
          onCancel={closeCreate}
        />
      )}
    </section>
  );
}
