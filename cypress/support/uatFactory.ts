import { uatRequest } from "./uatApi";

type Guest = {
  id: number;
};

type Room = {
  id: number;
  room_number: string;
  room_name: string;
  status: string;
  is_active: boolean;
};

export type Booking = {
  id: number;
  booking_reference: string;
  status: string;
};

export function createUatGuest(
  token: string,
): Cypress.Chainable<Guest> {
  const unique = Date.now();

  return uatRequest<Guest>({
    method: "POST",
    path: "/guests",
    token,
    body: {
      first_name: "UAT",
      last_name: `Guest${unique}`,
      phone: `9${String(unique).slice(-9)}`,
      city: "Jaisalmer",
      country: "India",
      is_active: true,
      notes: "CYPRESS UAT DATA",
    },
  }).then((response) => response.body);
}

export function createUatRoom(
  token: string,
): Cypress.Chainable<Room> {
  const unique = Date.now();

  return uatRequest<Room>({
    method: "POST",
    path: "/rooms",
    token,
    body: {
      room_number: `UAT-${unique}`,
      room_name: `UAT Room ${unique}`,
      room_type: "Heritage",
      floor: 1,
      capacity: 2,
      status: "available",
      is_active: true,
    },
  }).then((response) => response.body);
}

export function createUatBooking(
  token: string,
  guestId: number,
  roomId: number,
  checkIn: string,
  checkOut: string,
): Cypress.Chainable<Booking> {
  return uatRequest<Booking>({
    method: "POST",
    path: "/bookings",
    token,
    body: {
      guest_id: guestId,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      rate: 4900,
      source: "direct",
      notes: "UAT",
    },
  }).then((response) => response.body);
}

export function checkInUatBooking(
  token: string,
  bookingId: number,
): Cypress.Chainable<Booking> {
  return uatRequest<Booking>({
    method: "POST",
    path: `/bookings/${bookingId}/check-in`,
    token,
  }).then((response) => response.body);
}

export function cancelUatBooking(
  token: string,
  bookingId: number,
): Cypress.Chainable<Booking> {
  return uatRequest<Booking>({
    method: "POST",
    path: `/bookings/${bookingId}/cancel`,
    token,
  }).then((response) => response.body);
}
