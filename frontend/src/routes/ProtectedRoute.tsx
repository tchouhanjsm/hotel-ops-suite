import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading...</div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
