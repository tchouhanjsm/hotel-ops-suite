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
      { label: "Rooms", path: "/rooms", icon: BedDouble },
      { label: "Guests", path: "/guests", icon: Users },
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
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform duration-200 md:static md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="hos-sidebar-header flex h-16 items-center justify-between border-b px-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="hos-logo flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white">
                GJ
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    Garh Jaisal OS
                  </div>
                  <div className="text-xs text-gray-500">Hotel Operations</div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 md:hidden"
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
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
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

        <div className="hidden border-t p-3 md:block">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="border-t p-3 md:hidden">
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Menu size={18} />
            <span className="ml-2 text-sm">Close menu</span>
          </button>
        </div>
      </aside>
    </>
  );
}
