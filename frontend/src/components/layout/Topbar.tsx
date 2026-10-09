import { Bell, LogOut, Menu, Search, Sparkles, UserCircle } from "lucide-react";

import { useAuth } from "../../auth/useAuth";

type Props = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: Props) {
  const { staff, logout } = useAuth();

  const initials = (staff?.full_name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="hos-topbar sticky top-0 z-20 flex h-[72px] items-center justify-between border-b px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-gray-500 transition hover:bg-white/80"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hos-search hidden h-11 w-full max-w-[620px] items-center gap-3 rounded-2xl px-4 md:flex">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            type="search"
            placeholder="Search guests, bookings, rooms, folios..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Global search"
          />
          <span className="hidden rounded-lg border border-black/5 bg-white/70 px-2 py-1 text-[10px] font-medium text-gray-400 xl:inline-flex">
            /
          </span>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            className="hos-ai-entry flex items-center gap-2 rounded-2xl px-3.5 py-2 text-left transition hover:-translate-y-0.5"
            aria-label="Ask AI"
          >
            <div className="hos-ai-icon flex h-8 w-8 items-center justify-center rounded-xl">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--hos-ink)]">
                Ask AI
              </div>
              <div className="text-[11px] text-[var(--hos-muted)]">
                Search, summarize, spot issues
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="ml-4 flex items-center gap-1.5 md:gap-2.5">
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-gray-500 transition hover:bg-white/80"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#df8d78] ring-2 ring-white" />
        </button>

        <div className="hidden h-7 w-px bg-gray-200 sm:block" />

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/55 py-1.5 pl-1.5 pr-2.5 shadow-sm backdrop-blur-xl">
          <div className="hos-avatar flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm">
            {staff ? initials : <UserCircle size={20} />}
          </div>

          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-[var(--hos-ink)]">
              {staff?.full_name || "Admin"}
            </div>
            <div className="text-[11px] capitalize text-[var(--hos-muted)]">
              {staff?.role || "admin"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-xl p-2.5 text-gray-500 transition hover:bg-white/80"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
