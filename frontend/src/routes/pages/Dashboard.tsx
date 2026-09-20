import { useEffect, useState } from "react";
import { BedDouble, CalendarCheck, CalendarDays, Users } from "lucide-react";

import {
  getBookings,
  getGuests,
  getRooms,
  type Booking,
  type Guest,
  type Room,
} from "../../api/bookings";
import Alert from "../../components/ui/Alert";
import Card from "../../components/ui/Card";
import Loading from "../../components/ui/Loading";

const todayKey = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getRooms(), getGuests(), getBookings()])
      .then(([roomData, guestData, bookingData]) => {
        if (cancelled) {
          return;
        }

        setRooms(roomData);
        setGuests(guestData);
        setBookings(bookingData);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data.",
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

  const today = todayKey();
  const activeRooms = rooms.filter((room) => room.is_active);
  const activeGuests = guests.filter((guest) => guest.is_active);

  const availableRooms = activeRooms.filter(
    (room) => room.status === "available",
  ).length;

  const occupiedRooms = activeRooms.filter(
    (room) => room.status === "occupied",
  ).length;

  const arrivals = bookings.filter(
    (booking) => booking.check_in === today && booking.status === "confirmed",
  ).length;

  const departures = bookings.filter(
    (booking) => booking.check_out === today && booking.status === "checked_in",
  ).length;

  const cards = [
    {
      label: "Active Rooms",
      value: activeRooms.length,
      detail: `${availableRooms} available · ${occupiedRooms} occupied`,
      icon: BedDouble,
    },
    {
      label: "Active Guests",
      value: activeGuests.length,
      detail: "Guest profiles",
      icon: Users,
    },
    {
      label: "Today's Arrivals",
      value: arrivals,
      detail: "Confirmed bookings",
      icon: CalendarCheck,
    },
    {
      label: "Today's Departures",
      value: departures,
      detail: "Checked-in bookings",
      icon: CalendarDays,
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Hotel operations overview.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Card className="p-4">
          <Loading />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.label} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">{card.label}</div>
                  <div className="rounded-lg bg-base-200 p-2">
                    <Icon size={19} />
                  </div>
                </div>

                <div className="mt-4 text-3xl font-semibold">{card.value}</div>

                <div className="mt-1 text-sm text-gray-500">{card.detail}</div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
