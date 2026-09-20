import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import {
  cancelBooking,
  checkAvailability,
  checkInBooking,
  checkOutBooking,
  createBooking,
  getBookings,
  getGuests,
  getRooms,
  type Booking,
  type Guest,
  type Room,
} from "../../api/bookings";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value));

const today = new Date().toISOString().slice(0, 10);

const STATUS_STYLES: Record<Booking["status"], string> = {
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  checked_in: "bg-green-50 text-green-700 ring-green-200",
  checked_out: "bg-gray-100 text-gray-600 ring-gray-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  no_show: "bg-amber-50 text-amber-700 ring-amber-200",
};

function displayStatus(status: Booking["status"]) {
  return status.replace("_", " ");
}

async function fetchBookingData(): Promise<[Booking[], Guest[], Room[]]> {
  return Promise.all([getBookings(), getGuests(), getRooms()]);
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [guestId, setGuestId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState("");
  const [rate, setRate] = useState("4900");
  const [source, setSource] = useState("direct");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function applyBookingData(
    bookingData: Booking[],
    guestData: Guest[],
    roomData: Room[],
  ) {
    setBookings(bookingData);
    setGuests(guestData.filter((guest) => guest.is_active));
    setRooms(roomData.filter((room) => room.is_active));
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [bookingData, guestData, roomData] = await fetchBookingData();
      applyBookingData(bookingData, guestData, roomData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load booking data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void fetchBookingData()
      .then(([bookingData, guestData, roomData]) => {
        if (cancelled) {
          return;
        }

        applyBookingData(bookingData, guestData, roomData);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load booking data.",
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

  const guestMap = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest])),
    [guests],
  );

  const roomMap = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return bookings;
    }

    return bookings.filter((booking) => {
      const guest = guestMap.get(booking.guest_id);
      const room = roomMap.get(booking.room_id);

      return [
        booking.booking_reference,
        booking.status,
        booking.source,
        guest ? `${guest.first_name} ${guest.last_name}` : "",
        guest?.phone ?? "",
        room?.room_number ?? "",
        room?.room_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [bookings, guestMap, roomMap, search]);

  function resetForm() {
    setGuestId("");
    setRoomId("");
    setCheckIn(today);
    setCheckOut("");
    setRate("4900");
    setSource("direct");
    setNotes("");
  }

  function openCreate() {
    setError("");
    setMessage("");
    resetForm();
    setShowCreate(true);
  }

  function closeCreate() {
    if (saving) {
      return;
    }

    setShowCreate(false);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guestId || !roomId || !checkIn || !checkOut) {
      setError("Guest, room, check-in and check-out are required.");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }

    const numericRate = Number(rate);

    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      setError("Enter a valid nightly rate.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const availability = await checkAvailability(
        Number(roomId),
        checkIn,
        checkOut,
      );

      if (!availability.available) {
        throw new Error("Room is not available for the selected dates.");
      }

      const booking = await createBooking({
        guest_id: Number(guestId),
        room_id: Number(roomId),
        check_in: checkIn,
        check_out: checkOut,
        rate: numericRate,
        source,
        notes: notes.trim() || null,
      });

      setShowCreate(false);
      resetForm();
      setMessage(`Booking ${booking.booking_reference} created.`);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create booking.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function performAction(
    bookingId: number,
    action: () => Promise<Booking>,
    successMessage: string,
  ) {
    setBusyBookingId(bookingId);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyBookingId(null);
    }
  }

  async function handleCancel(booking: Booking) {
    const confirmed = window.confirm(
      `Cancel booking ${booking.booking_reference}?`,
    );

    if (!confirmed) {
      return;
    }

    await performAction(
      booking.id,
      () => cancelBooking(booking.id),
      `Booking ${booking.booking_reference} cancelled.`,
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Reservations, arrivals, stays and departures.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            data-testid="bookings-refresh"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            data-testid="new-booking"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus size={16} />
            New Booking
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            data-testid="bookings-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search booking, guest, phone, room, source or status..."
            className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Guest</th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Stay</th>
                <th className="px-5 py-3">Rate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredBookings.map((booking) => {
                  const guest = guestMap.get(booking.guest_id);
                  const room = roomMap.get(booking.room_id);
                  const busy = busyBookingId === booking.id;

                  return (
                    <tr
                      key={booking.id}
                      data-testid={`booking-row-${booking.id}`}
                      className="border-b last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {booking.booking_reference}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          Booking #{booking.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {guest
                            ? `${guest.first_name} ${guest.last_name}`
                            : `Guest #${booking.guest_id}`}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {guest?.phone ?? ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {room?.room_number ?? `Room #${booking.room_id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {room?.room_name ?? ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          {booking.check_in} → {booking.check_out}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {booking.nights} night
                          {booking.nights === 1 ? "" : "s"}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {money(booking.rate)}
                        <div className="text-xs font-normal text-gray-500">
                          / night
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[booking.status]}`}
                        >
                          {displayStatus(booking.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {booking.status === "confirmed" && (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void performAction(
                                    booking.id,
                                    () => checkInBooking(booking.id),
                                    `Booking ${booking.booking_reference} checked in.`,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-green-50 disabled:opacity-50"
                              >
                                <LogIn size={14} />
                                Check in
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleCancel(booking)}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle size={14} />
                                Cancel
                              </button>
                            </>
                          )}

                          {booking.status === "checked_in" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void performAction(
                                  booking.id,
                                  () => checkOutBooking(booking.id),
                                  `Booking ${booking.booking_reference} checked out.`,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                            >
                              <LogOut size={14} />
                              Check out
                            </button>
                          )}

                          {busy && (
                            <span className="self-center text-xs text-gray-400">
                              Working...
                            </span>
                          )}

                          {booking.status === "checked_out" && (
                            <span className="text-xs text-gray-400">
                              Completed
                            </span>
                          )}

                          {booking.status === "cancelled" && (
                            <span className="text-xs text-red-500">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto max-w-sm">
                      <CalendarDays
                        className="mx-auto text-gray-300"
                        size={32}
                      />
                      <div className="mt-3 font-medium text-gray-700">
                        No bookings found
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {search
                          ? "Try a different search term."
                          : "Create your first booking."}
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-gray-500"
                  >
                    Loading bookings...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreate();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  New Booking
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create a reservation for a guest and room.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreate}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-gray-800">Guest</span>
                  <select
                    required
                    data-testid="booking-guest"
                    name="guestId"
                    value={guestId}
                    onChange={(event) => setGuestId(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5"
                  >
                    <option value="">Select guest</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.first_name} {guest.last_name} · {guest.phone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-gray-800">Room</span>

                  <select
                    required
                    data-testid="booking-room"
                    name="roomId"
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5"
                  >
                    <option value="">Select room</option>

                    {rooms.map((room) => (
                      <option
                        key={room.id}
                        value={room.id}
                        disabled={
                          room.status === "maintenance" ||
                          room.status === "out_of_order"
                        }
                      >
                        {room.room_number} · {room.room_name} ·{" "}
                        {room.status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-gray-800">Check-in</span>
                  <input
                    required
                    data-testid="booking-check-in"
                    name="checkIn"
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-gray-800">Check-out</span>
                  <input
                    required
                    data-testid="booking-check-out"
                    name="checkOut"
                    type="date"
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-gray-800">
                    Nightly rate
                  </span>
                  <input
                    required
                    data-testid="booking-rate"
                    name="rate"
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-gray-800">Source</span>
                  <select
                    data-testid="booking-source"
                    name="source"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5"
                  >
                    <option value="direct">Direct</option>
                    <option value="booking.com">Booking.com</option>
                    <option value="expedia">Expedia</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="agent">Travel Agent</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-gray-800">Notes</span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5"
                  placeholder="Optional booking notes"
                />
              </label>

              <div className="flex justify-end gap-2 border-t pt-5">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={saving}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  data-testid="create-booking"
                  disabled={saving || !guestId}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
