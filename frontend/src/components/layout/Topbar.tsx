import { LogOut, Menu, UserCircle } from "lucide-react";

import { useAuth } from "../../auth/useAuth";

type Props = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: Props) {
  const { staff, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="text-sm font-semibold text-gray-900">
            Hotel Operations
          </div>
          <div className="text-xs text-gray-500">Garh Jaisal Haveli</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <UserCircle size={22} className="text-gray-500" />

        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-gray-900">
            {staff?.full_name || "Admin"}
          </div>
          <div className="text-xs capitalize text-gray-500">
            {staff?.role || "admin"}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
