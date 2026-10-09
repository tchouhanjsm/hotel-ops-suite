import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import AuditLog from "./pages/AuditLog";
import Bookings from "./pages/Bookings";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Folio from "./pages/Folio";
import Guests from "./pages/Guests";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";
import NotFound from "./NotFound";
import Payments from "./pages/Payments";
import Rooms from "./pages/Rooms";
import Settings from "./pages/Settings";
import Vouchers from "./pages/Vouchers";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/folio" element={<Folio />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
