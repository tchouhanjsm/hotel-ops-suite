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

export function createUatGuest(token: string): Cypress.Chainable<Guest> {
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

export function createUatRoom(token: string): Cypress.Chainable<Room> {
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

export type UatFolio = {
  id: number;
  folio_number: string;
  booking_id: number;
  status: string;
  currency: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  paid_amount: string;
  balance_due: string;
};

export type UatPayment = {
  id: number;
  payment_reference: string;
  folio_id: number;
  amount: string;
  payment_method: string;
  status: string;
};

export function createUatFolio(
  token: string,
  bookingId: number,
): Cypress.Chainable<UatFolio> {
  return uatRequest<UatFolio>({
    method: "POST",
    path: "/folios",
    token,
    body: {
      booking_id: bookingId,
      currency: "INR",
      notes: "CYPRESS UAT FOLIO",
    },
  }).then((response) => response.body);
}

export function getUatFolio(
  token: string,
  folioId: number,
): Cypress.Chainable<UatFolio> {
  return uatRequest<UatFolio>({
    method: "GET",
    path: `/folios/${folioId}`,
    token,
  }).then((response) => response.body);
}

export function createUatPayment(
  token: string,
  folioId: number,
  amount = 1000,
): Cypress.Chainable<UatPayment> {
  return uatRequest<UatPayment>({
    method: "POST",
    path: "/payments",
    token,
    body: {
      folio_id: folioId,
      amount,
      payment_method: "cash",
      notes: "CYPRESS UAT PAYMENT",
    },
  }).then((response) => response.body);
}


export type UatInvoice = {
  id: number;
  invoice_number: string;
  folio_id: number;
  status: string;
  grand_total: string;
  paid_amount: string;
  balance_due: string;
};

export function createUatInvoice(
  token: string,
  folioId: number,
): Cypress.Chainable<UatInvoice> {
  return uatRequest<UatInvoice>({
    method: "POST",
    path: "/invoices",
    token,
    body: {
      folio_id: folioId,
      notes: "CYPRESS UAT INVOICE",
    },
  }).then((response) => response.body);
}

export function finalizeUatInvoice(
  token: string,
  invoiceId: number,
): Cypress.Chainable<UatInvoice> {
  return uatRequest<UatInvoice>({
    method: "POST",
    path: `/invoices/${invoiceId}/finalize`,
    token,
  }).then((response) => response.body);
}

export function voidUatInvoice(
  token: string,
  invoiceId: number,
): Cypress.Chainable<UatInvoice> {
  return uatRequest<UatInvoice>({
    method: "POST",
    path: `/invoices/${invoiceId}/void`,
    token,
  }).then((response) => response.body);
}


export type UatCashVoucher = {
  id: number;
  voucher_number: string;
  status: string;
  amount: string;
  payee_name: string;
};

export function createUatCashVoucher(
  token: string,
  amount: number,
): Cypress.Chainable<UatCashVoucher> {
  return uatRequest<UatCashVoucher>({
    method: "POST",
    path: "/cash-vouchers",
    token,
    body: {
      voucher_date: new Date().toISOString().slice(0, 10),
      payee_name: "UAT Payee " + Date.now(),
      expense_category: "UAT",
      description: "CYPRESS UAT CASH VOUCHER",
      amount,
      currency: "INR",
    },
  }).then((response) => response.body);
}

export function getUatCashVoucher(
  token: string,
  voucherId: number,
): Cypress.Chainable<UatCashVoucher> {
  return uatRequest<UatCashVoucher>({
    method: "GET",
    path: "/cash-vouchers/" + voucherId,
    token,
  }).then((response) => response.body);
}

export function cancelUatCashVoucher(
  token: string,
  voucherId: number,
): Cypress.Chainable<UatCashVoucher> {
  return uatRequest<UatCashVoucher>({
    method: "POST",
    path: "/cash-vouchers/" + voucherId + "/cancel",
    token,
  }).then((response) => response.body);
}
