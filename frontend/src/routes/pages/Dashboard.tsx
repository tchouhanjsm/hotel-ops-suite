import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  CalendarDays,
  RefreshCw,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getBookings,
  getGuests,
  getRooms,
  type Booking,
  type Guest,
  type Room,
} from "../../api/bookings";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loading from "../../components/ui/Loading";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

const todayKey = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const statusLabel = (status: Booking["status"]) => status.replace("_", " ");

const statusClass: Record<Booking["status"], string> = {
  confirmed: "hos-badge hos-badge-info",
  checked_in: "hos-badge hos-badge-success",
  checked_out: "hos-badge hos-badge-neutral",
  cancelled: "hos-badge hos-badge-error",
  no_show: "hos-badge hos-badge-warning",
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [roomData, guestData, bookingData] = await Promise.all([
        getRooms(),
        getGuests(),
        getBookings(),
      ]);

      setRooms(roomData);
      setGuests(guestData);
      setBookings(bookingData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }

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

  const arrivals = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.check_in === today && booking.status === "confirmed",
      ),
    [bookings, today],
  );

  const departures = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.check_out === today && booking.status === "checked_in",
      ),
    [bookings, today],
  );

  const guestMap = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest])),
    [guests],
  );

  const roomMap = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );

  const cards = [
    {
      label: "Active Rooms",
      value: activeRooms.length,
      detail: `${availableRooms} available · ${occupiedRooms} occupied`,
      icon: BedDouble,
      tone: "success" as const,
    },
    {
      label: "Active Guests",
      value: activeGuests.length,
      detail: "Guest profiles",
      icon: Users,
      tone: "info" as const,
    },
    {
      label: "Today's Arrivals",
      value: arrivals.length,
      detail: "Confirmed bookings",
      icon: CalendarCheck,
      tone: "warning" as const,
    },
    {
      label: "Today's Departures",
      value: departures.length,
      detail: "Checked-in bookings",
      icon: CalendarDays,
      tone: "neutral" as const,
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your property's operational picture at a glance."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void loadData()}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </Button>

            <Button onClick={() => navigate("/bookings")}>View bookings</Button>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Card className="p-6">
          <Loading />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                detail={card.detail}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--hos-border)] px-5 py-4">
                <div>
                  <div className="hos-section-title">Today's arrivals</div>
                  <div className="hos-section-description">
                    Guests expected to check in today.
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/bookings")}
                >
                  View all
                </Button>
              </div>

              {arrivals.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  No arrivals scheduled today.
                </div>
              ) : (
                <div className="divide-y divide-[var(--hos-border)]">
                  {arrivals.slice(0, 5).map((booking) => {
                    const guest = guestMap.get(booking.guest_id);
                    const room = roomMap.get(booking.room_id);

                    return (
                      <button
                        type="button"
                        key={booking.id}
                        onClick={() => navigate("/bookings")}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50/70"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--hos-ink)]">
                            {guest
                              ? `${guest.first_name} ${guest.last_name}`
                              : `Guest #${booking.guest_id}`}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {booking.booking_reference} · Room{" "}
                            {room?.room_number ?? booking.room_id}
                          </div>
                        </div>

                        <span className={statusClass[booking.status]}>
                          {statusLabel(booking.status)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-[var(--hos-border)] px-5 py-4">
                <div className="hos-section-title">Room pulse</div>
                <div className="hos-section-description">
                  Current room availability across active inventory.
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Available</span>
                    <span className="font-semibold text-[var(--hos-ink)]">
                      {availableRooms}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[var(--hos-green)]"
                      style={{
                        width: `${
                          activeRooms.length
                            ? (availableRooms / activeRooms.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Occupied</span>
                    <span className="font-semibold text-[var(--hos-ink)]">
                      {occupiedRooms}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[var(--hos-blue)]"
                      style={{
                        width: `${
                          activeRooms.length
                            ? (occupiedRooms / activeRooms.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/rooms")}
                >
                  Manage rooms
                </Button>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--hos-border)] px-5 py-4">
              <div>
                <div className="hos-section-title">Today's departures</div>
                <div className="hos-section-description">
                  Guests scheduled to check out today.
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/bookings")}
              >
                View bookings
              </Button>
            </div>

            {departures.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No departures scheduled today.
              </div>
            ) : (
              <div className="grid gap-px bg-[var(--hos-border)] md:grid-cols-2 xl:grid-cols-3">
                {departures.slice(0, 6).map((booking) => {
                  const guest = guestMap.get(booking.guest_id);
                  const room = roomMap.get(booking.room_id);

                  return (
                    <button
                      type="button"
                      key={booking.id}
                      onClick={() => navigate("/bookings")}
                      className="bg-white px-5 py-4 text-left transition hover:bg-gray-50/70"
                    >
                      <div className="text-sm font-semibold text-[var(--hos-ink)]">
                        {guest
                          ? `${guest.first_name} ${guest.last_name}`
                          : `Guest #${booking.guest_id}`}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        Room {room?.room_number ?? booking.room_id} ·{" "}
                        {booking.booking_reference}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
