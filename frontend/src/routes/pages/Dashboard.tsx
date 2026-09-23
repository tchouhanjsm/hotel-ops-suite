import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BedDouble,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Clock3,
  LogIn,
  LogOut,
  Sparkles,
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
import StatCard from "../../components/ui/StatCard";

type View = "arrivals" | "in-house" | "departures";

const todayKey = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const dateLabel = (value: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);

const greetingLabel = (value: Date) => {
  const hour = value.getHours();

  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
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
  const [activeView, setActiveView] = useState<View>("arrivals");

  const loadData = useCallback(async () => {
    setError("");

    setLoading(true);

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
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const today = todayKey();
  const now = new Date();
  const activeRooms = rooms.filter((room) => room.is_active);
  const activeGuests = guests.filter((guest) => guest.is_active);

  const availableRooms = activeRooms.filter(
    (room) => room.status === "available",
  ).length;
  const occupiedRooms = activeRooms.filter(
    (room) => room.status === "occupied",
  ).length;
  const occupancyRate = activeRooms.length
    ? Math.round((occupiedRooms / activeRooms.length) * 100)
    : 0;

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

  const inHouse = useMemo(
    () => bookings.filter((booking) => booking.status === "checked_in"),
    [bookings],
  );

  const visibleBookings = useMemo(() => {
    if (activeView === "arrivals") return arrivals;
    if (activeView === "departures") return departures;
    return inHouse;
  }, [activeView, arrivals, departures, inHouse]);

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
      label: "Arrivals today",
      value: arrivals.length,
      detail: "Guests expected",
      icon: CalendarCheck2,
      tone: "info" as const,
    },
    {
      label: "In-house guests",
      value: inHouse.length,
      detail: "Currently staying",
      icon: Users,
      tone: "success" as const,
    },
    {
      label: "Departures today",
      value: departures.length,
      detail: "Ready for checkout",
      icon: CalendarDays,
      tone: "warning" as const,
    },
    {
      label: "Rooms available",
      value: availableRooms,
      detail: occupancyRate + "% occupied",
      icon: BedDouble,
      tone: "neutral" as const,
    },
  ];

  const renderGuestName = (booking: Booking) => {
    const guest = guestMap.get(booking.guest_id);
    return guest
      ? guest.first_name + " " + guest.last_name
      : "Guest #" + booking.guest_id;
  };

  const renderRoom = (booking: Booking) =>
    roomMap.get(booking.room_id)?.room_number ?? booking.room_id;

  const viewMeta: Record<View, { label: string; count: number }> = {
    arrivals: { label: "Arrivals", count: arrivals.length },
    "in-house": { label: "In-house", count: inHouse.length },
    departures: { label: "Departures", count: departures.length },
  };

  return (
    <section className="space-y-6">
      <div className="hos-glass relative overflow-hidden rounded-[30px] px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <img
          src="/jaisalmer-fort-landscape.svg"
          alt=""
          aria-hidden="true"
          className="hos-fort-art pointer-events-none absolute bottom-0 right-0 h-36 w-[58%] object-contain object-bottom opacity-[0.18] sm:h-44 lg:h-52"
        />

        <div className="relative z-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--hos-subtle)]">
                Garh Jaisal Haveli · Jaisalmer
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-[var(--hos-ink)] sm:text-5xl">
                {greetingLabel(now)}
                <br />
                Here is today's picture.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--hos-muted)] sm:text-[15px]">
                Keep arrivals moving, rooms ready and the front desk focused on
                the guest.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <div className="rounded-2xl border border-white/80 bg-white/76 px-4 py-3 text-sm text-[var(--hos-text)] shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Clock3 size={16} className="text-[var(--hos-blue)]" />
                  {dateLabel(now)}
                </div>
              </div>

              <Button onClick={() => navigate("/bookings")}>
                <CalendarCheck2 size={16} />
                New booking
              </Button>

              <button
                type="button"
                onClick={() => void loadData("refresh")}
                disabled={refreshing}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/72 px-3.5 text-sm font-medium text-[var(--hos-text)] shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="font-[cursive] text-xl italic text-[var(--hos-brand-dark)]">
              More than a stay, a story...
            </div>
            <div className="hidden h-px w-14 bg-[var(--hos-brand)]/40 sm:block" />
          </div>
        </div>
      </div>

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

          <div className="grid gap-5 xl:grid-cols-[1.35fr_.75fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-[var(--hos-border)] px-5 pt-4 sm:px-6">
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(viewMeta) as View[]).map((view) => {
                    const item = viewMeta[view];
                    const active = activeView === view;

                    return (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setActiveView(view)}
                        className={[
                          "rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                          active
                            ? "bg-[var(--hos-lilac-soft)] text-[#5d57a4]"
                            : "text-[var(--hos-muted)] hover:bg-gray-50",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        {item.label}
                        <span className="ml-1.5 text-xs opacity-70">
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="hos-section-title">
                      {viewMeta[activeView].label} today
                    </div>
                    <div className="hos-section-description">
                      {activeView === "arrivals"
                        ? "Guests expected to check in today."
                        : activeView === "in-house"
                          ? "Guests currently staying at the hotel."
                          : "Guests scheduled to check out today."}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/bookings")}
                  >
                    View all
                    <ArrowUpRight size={14} />
                  </Button>
                </div>

                {visibleBookings.length === 0 ? (
                  <div className="rounded-2xl bg-[var(--hos-surface-soft)] px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hos-blue-soft)] text-[var(--hos-blue)]">
                      {activeView === "departures" ? (
                        <LogOut size={20} />
                      ) : activeView === "in-house" ? (
                        <Users size={20} />
                      ) : (
                        <LogIn size={20} />
                      )}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[var(--hos-ink)]">
                      Nothing to show here
                    </div>
                    <div className="mt-1 text-xs text-[var(--hos-muted)]">
                      This part of the day is currently clear.
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--hos-border)]">
                    {visibleBookings.slice(0, 6).map((booking) => (
                      <button
                        type="button"
                        key={booking.id}
                        onClick={() => navigate("/bookings")}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-white/65"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--hos-blue-soft)] text-xs font-semibold text-[var(--hos-blue)]">
                            {renderGuestName(booking)
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[var(--hos-ink)]">
                              {renderGuestName(booking)}
                            </div>
                            <div className="mt-1 text-xs text-[var(--hos-muted)]">
                              {booking.booking_reference} · Room{" "}
                              {renderRoom(booking)}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className={statusClass[booking.status]}>
                            {statusLabel(booking.status)}
                          </span>
                          <ChevronRight
                            size={16}
                            className="text-[var(--hos-subtle)]"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-[var(--hos-border)] px-5 py-4 sm:px-6">
                <div className="hos-section-title">Room pulse</div>
                <div className="hos-section-description">
                  A simple picture of today's inventory.
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-2xl bg-gradient-to-br from-[#eef4ff] via-[#f4f1ff] to-[#fff7f1] p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--hos-subtle)]">
                        Occupancy
                      </div>
                      <div className="mt-2 flex items-end gap-1">
                        <span className="text-3xl font-semibold tracking-[-0.04em] text-[var(--hos-ink)]">
                          {occupancyRate}
                        </span>
                        <span className="mb-1 text-sm font-medium text-[var(--hos-muted)]">
                          %
                        </span>
                      </div>
                    </div>
                    <BedDouble
                      size={23}
                      className="text-[var(--hos-lilac)]"
                    />
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-[var(--hos-lilac)] transition-[width] duration-500"
                      style={{ width: String(occupancyRate) + "%" }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-xs">
                    <span className="text-[var(--hos-muted)]">
                      {occupiedRooms} occupied
                    </span>
                    <span className="font-medium text-[var(--hos-text)]">
                      {availableRooms} available
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[var(--hos-mint-soft)] p-4">
                    <div className="text-xs text-[var(--hos-muted)]">
                      Active guests
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--hos-ink)]">
                      {activeGuests.length}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[var(--hos-peach-soft)] p-4">
                    <div className="text-xs text-[var(--hos-muted)]">
                      Active rooms
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--hos-ink)]">
                      {activeRooms.length}
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/rooms")}
                >
                  Manage rooms
                  <ArrowUpRight size={14} />
                </Button>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1fr_.9fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--hos-border)] px-5 py-4 sm:px-6">
                <div>
                  <div className="hos-section-title">Departure flow</div>
                  <div className="hos-section-description">
                    Keep today's checkouts visible.
                  </div>
                </div>
                <LogOut size={18} className="text-[var(--hos-blue)]" />
              </div>

              {departures.length === 0 ? (
                <div className="px-5 py-8 text-sm text-[var(--hos-muted)]">
                  No departures scheduled today.
                </div>
              ) : (
                <div className="divide-y divide-[var(--hos-border)]">
                  {departures.slice(0, 4).map((booking) => (
                    <button
                      type="button"
                      key={booking.id}
                      onClick={() => navigate("/bookings")}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-white/65"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[var(--hos-ink)]">
                          {renderGuestName(booking)}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--hos-muted)]">
                          Room {renderRoom(booking)}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-[var(--hos-subtle)]"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--hos-border)] px-5 py-4 sm:px-6">
                <div>
                  <div className="hos-section-title">Quick actions</div>
                  <div className="hos-section-description">
                    The jobs you reach for most often.
                  </div>
                </div>
                <Sparkles size={18} className="text-[var(--hos-lilac)]" />
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => navigate("/bookings")}
                >
                  New booking
                  <ArrowUpRight size={14} />
                </Button>
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => navigate("/rooms")}
                >
                  Check rooms
                  <ArrowUpRight size={14} />
                </Button>
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => navigate("/folio")}
                >
                  Open folio
                  <ArrowUpRight size={14} />
                </Button>
                <Button
                  variant="secondary"
                  className="justify-between"
                  onClick={() => navigate("/payments")}
                >
                  Record payment
                  <ArrowUpRight size={14} />
                </Button>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-[#eeeafb] bg-gradient-to-br from-[#f4f0ff] via-[#f5f8ff] to-[#fff5ee] p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/70 blur-2xl" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-[var(--hos-lilac)] shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div className="mt-5 text-sm font-semibold text-[var(--hos-ink)]">
                  AI workspace
                </div>
                <div className="mt-2 text-xs leading-5 text-[var(--hos-muted)]">
                  A natural-language layer for finding records, summarising the
                  day and spotting operational follow-ups.
                </div>
                <Button variant="secondary" size="sm" className="mt-5" disabled>
                  Coming next
                  <ArrowUpRight size={13} />
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
