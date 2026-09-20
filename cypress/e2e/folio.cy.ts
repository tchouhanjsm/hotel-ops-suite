import {
  createUatBooking,
  createUatFolio,
  createUatGuest,
  createUatRoom,
} from "../support/uatFactory";

import { establishUatSession, loginUatAdmin } from "../support/uatApi";

type UatContext = {
  folioId: number;
  roomId: number;
  guestId: number;
  token: string;
};

function futureDates() {
  const start = new Date();
  start.setDate(start.getDate() + 40);

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    checkIn: format(start),
    checkOut: format(end),
  };
}

function prepareFolio(): Cypress.Chainable<UatContext> {
  return loginUatAdmin()
    .then((auth) => auth.access_token)
    .then((token) => {
      const dates = futureDates();

      return createUatGuest(token).then((guest) =>
        createUatRoom(token).then((room) =>
          createUatBooking(
            token,
            guest.id,
            room.id,
            dates.checkIn,
            dates.checkOut,
          ).then((booking) =>
            createUatFolio(token, booking.id).then((folio) => ({
              token,
              folioId: folio.id,
              roomId: room.id,
              guestId: guest.id,
            })),
          ),
        ),
      );
    });
}

describe("Folio UAT", () => {
  beforeEach(() => {
    establishUatSession();
  });

  it("loads a booking folio and shows its room charge", () => {
    prepareFolio().then((ctx) => {
      cy.visit("/folio");

      cy.get('[data-testid="folio-id"]').clear().type(String(ctx.folioId));

      cy.get('[data-testid="load-folio"]').click();

      cy.get('[data-testid="folio-number"]').should("be.visible");
      cy.contains(`Room ${ctx.roomId} - 2 night(s)`).should("be.visible");
      cy.contains("Subtotal").should("be.visible");
      cy.contains("Tax").should("be.visible");
      cy.contains("Grand Total").should("be.visible");
      cy.contains("Balance Due").should("be.visible");
    });
  });
});
