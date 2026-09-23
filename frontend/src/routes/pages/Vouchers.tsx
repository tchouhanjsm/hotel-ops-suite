import { useSearchParams } from "react-router-dom";

import Card from "../../components/ui/Card";
import CashVoucherWorkspace from "../../components/vouchers/CashVoucherWorkspace";
import ServiceVoucherWorkspace from "../../components/vouchers/ServiceVoucherWorkspace";

type Tab = "cash" | "service";

export default function Vouchers() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: Tab =
    searchParams.get("tab") === "service" ? "service" : "cash";

  function selectTab(tab: Tab) {
    const next = new URLSearchParams(searchParams);

    if (tab === "cash") {
      next.delete("tab");
    } else {
      next.set("tab", "service");
    }

    setSearchParams(next);
  }

  return (
    <section className="space-y-6">
      <Card className="p-2">
        <div
          className="flex flex-wrap gap-1"
          role="tablist"
          aria-label="Voucher type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cash"}
            onClick={() => selectTab("cash")}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              activeTab === "cash"
                ? "bg-white text-[var(--hos-ink)] shadow-sm"
                : "text-[var(--hos-muted)] hover:text-[var(--hos-text)]",
            ].join(" ")}
          >
            Cash Vouchers
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "service"}
            onClick={() => selectTab("service")}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition",
              activeTab === "service"
                ? "bg-white text-[var(--hos-ink)] shadow-sm"
                : "text-[var(--hos-muted)] hover:text-[var(--hos-text)]",
            ].join(" ")}
          >
            Service Vouchers
          </button>
        </div>
      </Card>

      {activeTab === "cash" ? (
        <CashVoucherWorkspace />
      ) : (
        <ServiceVoucherWorkspace />
      )}
    </section>
  );
}
