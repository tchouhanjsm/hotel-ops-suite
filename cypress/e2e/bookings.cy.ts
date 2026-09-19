import {
  cancelUatBooking,
  checkInUatBooking,
  createUatBooking,
  createUatGuest,
  createUatRoom,
} from "../support/uatFactory";

import {
  establishUatSession,
  loginUatAdmin,
} from "../support/uatApi";

type UatContext = {
  token: string;
  guestId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
};

function futureDates(offset = 0): {
  checkIn: string;
  checkOut: string;
} {
  const start = new Date();
  start.setDate(start.getDate() + 30 + offset);

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const format = (date: Date): string => {
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

function prepareBooking(offset = 0): Cypress.Chainable<UatContext> {
  return loginUatAdmin()
    .then((auth) => auth.access_token)
    .then((token) => {
      const { checkIn, checkOut } = futureDates(offset);

      return createUatGuest(token).then((guest) =>
        createUatRoom(token).then((room) => ({
          token,
          guestId: guest.id,
          roomId: room.id,
          checkIn,
          checkOut,
        })),
      );
    });
}

function login() {
  establishUatSession();
}

describe("Bookings UAT", () => {
  beforeEach(() => {
    login();
  });

  it("loads the bookings page", () => {
    cy.visit("/bookings");

    cy.contains("h1", "Bookings").should("be.visible");
    cy.get('input[placeholder*="Search booking"]')
      .should("be.visible");
    cy.contains("button", "New Booking")
      .should("be.visible");
  });

  it("searches bookings", () => {
    cy.visit("/bookings");

    cy.get('input[placeholder*="Search booking"]')
      .should("be.visible")
      .type("UAT");

    cy.contains("Showing").should("be.visible");
  });

  it("opens the new booking form", () => {
    cy.visit("/bookings");

    cy.contains("button", "New Booking").click();
    cy.contains("h2", "New Booking")
      .should("be.visible");
  });

  it("creates a booking", () => {
    prepareBooking(1).then((ctx) => {
      cy.visit("/bookings");
      cy.contains("button", "New Booking").click();

      cy.get("select")
        .filter(":visible")
        .first()
        .select(String(ctx.guestId));

      cy.get("select")
        .filter(":visible")
        .eq(1)
        .select(String(ctx.roomId));

      cy.get('input[type="date"]')
        .filter(":visible")
        .first()
        .clear()
        .type(ctx.checkIn);

      cy.get('input[type="date"]')
        .filter(":visible")
        .eq(1)
        .clear()
        .type(ctx.checkOut);

      cy.get('input[type="number"]')
        .filter(":visible")
        .first()
        .clear()
        .type("4900");

      cy.get("select")
        .filter(":visible")
        .eq(2)
        .select("direct");

      cy.contains("button", "Create Booking").click();

      cy.contains("created.").should("be.visible");
    });
  });

  it("rejects an unavailable room/date combination", () => {
    prepareBooking(2).then((ctx) => {
      createUatBooking(
        ctx.token,
        ctx.guestId,
        ctx.roomId,
        ctx.checkIn,
        ctx.checkOut,
      ).then(() => {
        cy.visit("/bookings");
        cy.contains("button", "New Booking").click();

        cy.get("select")
          .filter(":visible")
          .first()
          .select(String(ctx.guestId));

        cy.get("select")
          .filter(":visible")
          .eq(1)
          .select(String(ctx.roomId));

        cy.get('input[type="date"]')
          .filter(":visible")
          .first()
          .clear()
          .type(ctx.checkIn);

        cy.get('input[type="date"]')
          .filter(":visible")
          .eq(1)
          .clear()
          .type(ctx.checkOut);

        cy.get('input[type="number"]')
          .filter(":visible")
          .first()
          .clear()
          .type("4900");

        cy.contains("button", "Create Booking").click();

        cy.contains(
          "Room is not available for the selected dates.",
        ).should("be.visible");
      });
    });
  });

  it("checks a confirmed booking in", () => {
    prepareBooking(3).then((ctx) => {
      createUatBooking(
        ctx.token,
        ctx.guestId,
        ctx.roomId,
        ctx.checkIn,
        ctx.checkOut,
      ).then((booking) => {
        cy.visit("/bookings");

        cy.get('input[placeholder*="Search booking"]')
          .clear()
          .type(booking.booking_reference);

        cy.contains(booking.booking_reference)
          .should("be.visible");

        cy.contains("button", "Check in")
          .should("be.visible")
          .click();

        cy.contains("checked in.")
          .should("be.visible");
      });
    });
  });

  it("checks an in-house booking out", () => {
    prepareBooking(4).then((ctx) => {
      createUatBooking(
        ctx.token,
        ctx.guestId,
        ctx.roomId,
        ctx.checkIn,
        ctx.checkOut,
      ).then((booking) => {
        checkInUatBooking(
          ctx.token,
          booking.id,
        ).then(() => {
          cy.visit("/bookings");

          cy.get('input[placeholder*="Search booking"]')
            .clear()
            .type(booking.booking_reference);

          cy.contains(booking.booking_reference)
            .should("be.visible");

          cy.contains("button", "Check out")
            .should("be.visible")
            .click();

          cy.contains("checked out.")
            .should("be.visible");
        });
      });
    });
  });

  it("cancels a confirmed booking", () => {
    prepareBooking(5).then((ctx) => {
      createUatBooking(
        ctx.token,
        ctx.guestId,
        ctx.roomId,
        ctx.checkIn,
        ctx.checkOut,
      ).then((booking) => {
        cy.visit("/bookings");

        cy.get('input[placeholder*="Search booking"]')
          .clear()
          .type(booking.booking_reference);

        cy.contains(booking.booking_reference)
          .should("be.visible");

        cy.on("window:confirm", () => true);

        cy.contains("button", "Cancel")
          .should("be.visible")
          .click();

        cy.contains("cancelled.")
          .should("be.visible");
      });
    });
  });

  it("searches for a cancelled booking", () => {
    prepareBooking(6).then((ctx) => {
      createUatBooking(
        ctx.token,
        ctx.guestId,
        ctx.roomId,
        ctx.checkIn,
        ctx.checkOut,
      ).then((booking) => {
        cancelUatBooking(
          ctx.token,
          booking.id,
        ).then(() => {
          cy.visit("/bookings");

          cy.get('input[placeholder*="Search booking"]')
            .clear()
            .type(booking.booking_reference);

          cy.contains(booking.booking_reference)
            .should("be.visible");

          cy.contains("cancelled")
            .should("be.visible");
        });
      });
    });
  });
});