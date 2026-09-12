import { NavLink } from "react-router-dom";

const links = [
  ["Dashboard", "/dashboard"],
  ["Bookings", "/bookings"],
  ["Rooms", "/rooms"],
  ["Guests", "/guests"],
  ["Folio", "/folio"],
  ["Payments", "/payments"],
  ["Vouchers", "/vouchers"],
  ["Invoices", "/invoices"],
  ["Settings", "/settings"],
];

export default function Sidebar() {
  return (
    <aside>
      <div>
        <strong>Garh Jaisal OS</strong>
      </div>

      <nav aria-label="Main navigation">
        {links.map(([label, path]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
