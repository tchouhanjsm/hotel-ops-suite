import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { apiFetch } from "../../api/client";

type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

type CalendarEntry = {
  booking_id: number;
  booking_reference: string;
  guest_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  status: BookingStatus;
};

const statusStyles: Record<BookingStatus, string> = {
  confirmed: "border-[#d8c28f] bg-[#fff8e9] text-[#7b5d17]",
  checked_in: "border-[#b8dfd1] bg-[#edf9f4] text-[#23634f]",
  checked_out: "border-[#c9d6ec] bg-[#f0f5fd] text-[#435d81]",
  cancelled: "border-[#e4caca] bg-[#fff2f2] text-[#8b4a4a]",
  no_show: "border-[#dfd2c3] bg-[#f7f2ec] text-[#715f4b]",
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfCalendarGrid(date: Date): Date {
  const first = startOfMonth(date);
  return new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
}

function endOfCalendarGrid(date: Date): Date {
  const last = endOfMonth(date);
  const daysToAdd = 6 - last.getDay();
  return new Date(last.getFullYear(), last.getMonth(), last.getDate() + daysToAdd);
}

function isSameDay(left: Date, right: Date): boolean {
  return formatDate(left) === formatDate(right);
}

function isBetween(
  day: Date,
  checkIn: string,
  checkOut: string,
): boolean {
  const current = formatDate(day);
  return current >= checkIn && current < checkOut;
}

function statusLabel(status: BookingStatus): string {
  return status.replace("_", " ");
}

export default function Calendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rangeStart = formatDate(startOfCalendarGrid(month));
  const rangeEnd = formatDate(
    new Date(endOfCalendarGrid(month).getFullYear(), endOfCalendarGrid(month).getMonth(), endOfCalendarGrid(month).getDate() + 1),
  );

  useEffect(() => {
    let active = true;

    async function loadCalendar() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          start_date: rangeStart,
          end_date: rangeEnd,
        });

        if (status) {
          params.set("status", status);
        }

        if (roomId) {
          params.set("room_id", roomId);
        }

        const data = await apiFetch<CalendarEntry[]>(
          `/calendar?${params.toString()}`,
        );

        if (active) {
          setEntries(data);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the calendar.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCalendar();

    return () => {
      active = false;
    };
  }, [rangeStart, rangeEnd, roomId, status]);

  const days = useMemo(() => {
    const start = startOfCalendarGrid(month);
    const end = endOfCalendarGrid(month);
    const result: Date[] = [];

    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      result.push(new Date(cursor));
    }

    return result;
  }, [month]);

  const rooms = useMemo(
    () =>
      [...new Set(entries.map((entry) => entry.room_id))].sort(
        (left, right) => left - right,
      ),
    [entries],
  );

  const today = new Date();

  return (
    <main className="space-y-6" data-testid="calendar-page">
      <section className="hos-panel overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--hos-brand-dark)]">
              <CalendarDays size={15} />
              Operations
            </div>
            <h1
              className="text-2xl font-semibold tracking-[-0.03em] text-[var(--hos-ink)] sm:text-3xl"
              data-testid="calendar-heading"
            >
              Stay calendar
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--hos-muted)]">
              See the hotel rhythm at a glance, with bookings projected from the
              operational calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth(startOfMonth(today))}
              className="hos-button-secondary"
              data-testid="calendar-today"
            >
              Today
            </button>

            <div className="flex items-center rounded-xl border border-[var(--hos-border)] bg-white/75 p-1">
              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                className="rounded-lg p-2 text-[var(--hos-muted)] transition hover:bg-slate-100"
                aria-label="Previous month"
                data-testid="calendar-prev"
              >
                <ChevronLeft size={17} />
              </button>

              <div
                className="min-w-[145px] px-3 text-center text-sm font-semibold text-[var(--hos-ink)]"
                aria-live="polite"
              >
                {month.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                className="rounded-lg p-2 text-[var(--hos-muted)] transition hover:bg-slate-100"
                aria-label="Next month"
                data-testid="calendar-next"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="hos-panel p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-[var(--hos-muted)]">
            {entries.length} booking{entries.length === 1 ? "" : "s"} in view
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BookingStatus | "")
              }
              className="rounded-xl border border-[var(--hos-border)] bg-white px-3 py-2 text-sm text-[var(--hos-ink)] outline-none"
              aria-label="Filter by booking status"
            >
              <option value="">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked in</option>
              <option value="checked_out">Checked out</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </select>

            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="rounded-xl border border-[var(--hos-border)] bg-white px-3 py-2 text-sm text-[var(--hos-ink)] outline-none"
              aria-label="Filter by room"
            >
              <option value="">All rooms</option>
              {rooms.map((id) => (
                <option key={id} value={id}>
                  Room {id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            data-testid="calendar-error"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-7 border-b border-[var(--hos-border)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hos-subtle)]"
                >
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div
                className="flex min-h-[420px] items-center justify-center"
                data-testid="calendar-loading"
              >
                <Loader2
                  size={22}
                  className="animate-spin text-[var(--hos-brand-dark)]"
                />
              </div>
            ) : (
              <div
                className="grid grid-cols-7"
                data-testid="calendar-grid"
              >
                {days.map((day) => {
                  const dayEntries = entries.filter((entry) =>
                    isBetween(day, entry.check_in, entry.check_out),
                  );
                  const isCurrentMonth = day.getMonth() === month.getMonth();
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={formatDate(day)}
                      className={[
                        "min-h-[145px] border-b border-r border-[var(--hos-border)] p-2",
                        isCurrentMonth ? "bg-white/60" : "bg-slate-50/55",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                            isToday
                              ? "bg-[var(--hos-brand-dark)] text-white"
                              : isCurrentMonth
                                ? "text-[var(--hos-ink)]"
                                : "text-[var(--hos-subtle)]",
                          ].join(" ")}
                        >
                          {day.getDate()}
                        </span>
                        {dayEntries.length > 0 && (
                          <span className="text-[10px] font-medium text-[var(--hos-subtle)]">
                            {dayEntries.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {dayEntries.map((entry) => (
                          <div
                            key={`${formatDate(day)}-${entry.booking_id}`}
                            className={[
                              "rounded-xl border px-2.5 py-2 text-left shadow-[0_4px_14px_rgba(51,65,85,0.04)]",
                              statusStyles[entry.status],
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-[11px] font-semibold">
                                {entry.booking_reference}
                              </span>
                              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] opacity-75">
                                R{entry.room_id}
                              </span>
                            </div>

                            <div className="mt-1 truncate text-[10px] capitalize opacity-75">
                              {statusLabel(entry.status)}
                            </div>

                            {formatDate(day) === entry.check_in && (
                              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] opacity-80">
                                Check-in
                              </div>
                            )}

                            {formatDate(day) === entry.check_out && (
                              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] opacity-80">
                                Check-out
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
