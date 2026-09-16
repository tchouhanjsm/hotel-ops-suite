import { apiFetch } from "./client";

export type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export type Booking = {
  id: number;
  booking_reference: string;
  guest_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  nights: number;
  rate: string;
  source: string;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};

export type Guest = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  is_active: boolean;
};

export type Room = {
  id: number;
  room_number: string;
  room_name: string;
  room_type: string;
  floor: number;
  capacity: number;
  status: string;
  is_active: boolean;
};

export function getBookings() {
  return apiFetch<Booking[]>("/bookings");
}

export function getGuests() {
  return apiFetch<Guest[]>("/guests");
}

export function getRooms() {
  return apiFetch<Room[]>("/rooms");
}

export function checkAvailability(
  roomId: number,
  checkIn: string,
  checkOut: string,
) {
  return apiFetch<{ room_id: number; available: boolean }>(
    `/bookings/availability?room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}`,
  );
}

export function createBooking(data: {
  guest_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  rate: number;
  source: string;
  notes?: string | null;
}) {
  return apiFetch<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function cancelBooking(id: number) {
  return apiFetch<Booking>(`/bookings/${id}/cancel`, {
    method: "POST",
  });
}

export function checkInBooking(id: number) {
  return apiFetch<Booking>(`/bookings/${id}/check-in`, {
    method: "POST",
  });
}

export function checkOutBooking(id: number) {
  return apiFetch<Booking>(`/bookings/${id}/check-out`, {
    method: "POST",
  });
}
