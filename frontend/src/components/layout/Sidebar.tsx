import {
  BedDouble,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Gauge,
  Menu,
  Settings,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
};

const groups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/dashboard", icon: Gauge }],
  },
  {
    label: "Operations",
    items: [
      { label: "Bookings", path: "/bookings", icon: BookOpen },
      { label: "Guests", path: "/guests", icon: Users },
      { label: "Rooms", path: "/rooms", icon: BedDouble },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Folio", path: "/folio", icon: WalletCards },
      { label: "Payments", path: "/payments", icon: CreditCard },
      { label: "Vouchers", path: "/vouchers", icon: Building2 },
      { label: "Invoices", path: "/invoices", icon: FileText },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Audit Log", path: "/audit-log", icon: FileText },
    ],
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: Props) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={[
          "hos-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform duration-200 md:static md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="hos-sidebar-header flex h-[72px] items-center justify-between border-b px-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff8eb] shadow-sm">
                <img
                  src="/hotel-fort-mark.svg"
                  alt="Hotel Ops Suite"
                  className="h-9 w-9"
                />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--hos-ink)]">
                    Hotel Ops Suite
                  </div>
                  <div className="text-[11px] text-[var(--hos-muted)]">
                    Jaisalmer · Rajasthan
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-white/80 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-6 overflow-y-auto p-3"
        >
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="mb-2 px-3 hos-nav-section text-[11px] font-semibold uppercase tracking-[0.12em]">
                  {group.label}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map(({ label, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={onCloseMobile}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        collapsed ? "justify-center" : "",
                        isActive ? "hos-nav-active" : "hos-nav-link",
                      ].join(" ")
                    }
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    {!collapsed && <span>{label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="relative hidden h-44 overflow-hidden border-t border-[var(--hos-border)] md:block">
            <img
              src="/jaisalmer-fort-landscape.svg"
              alt=""
              aria-hidden="true"
              className="hos-fort-art absolute bottom-0 left-0 h-36 w-[145%] max-w-none object-cover object-left-bottom opacity-[0.30]"
            />

            <div className="absolute bottom-5 left-5 right-5">
              <div className="font-[cursive] text-xl leading-tight italic text-[var(--hos-brand-dark)]">
                Heritage
                <br />
                Hospitality
                <br />
                Simplified
              </div>
              <div className="mt-3 h-px w-12 bg-[var(--hos-brand)]/45" />
              <div className="mt-3 text-[9px] font-medium uppercase tracking-[0.24em] text-[var(--hos-subtle)]">
                Jaisalmer · India
              </div>
            </div>
          </div>
        )}

        <div className="hidden border-t border-[var(--hos-border)] p-3 md:block">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-xl p-2 text-gray-500 transition hover:bg-white/80"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="border-t border-[var(--hos-border)] p-3 md:hidden">
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center rounded-xl p-2 text-gray-500 transition hover:bg-white/80"
          >
            <Menu size={18} />
            <span className="ml-2 text-sm">Close menu</span>
          </button>
        </div>
      </aside>
    </>
  );
}