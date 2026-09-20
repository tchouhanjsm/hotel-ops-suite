import {
  createUatBooking,
  createUatFolio,
  createUatGuest,
  createUatPayment,
  createUatRoom,
  getUatFolio,
} from "../support/uatFactory";

import { establishUatSession, loginUatAdmin } from "../support/uatApi";

type UatContext = {
  token: string;
  folioId: number;
};

function futureDates(offset = 0) {
  const start = new Date();
  start.setDate(start.getDate() + 50 + offset);

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

function prepareFolio(offset = 0): Cypress.Chainable<UatContext> {
  return loginUatAdmin()
    .then((auth) => auth.access_token)
    .then((token) => {
      const dates = futureDates(offset);

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
            })),
          ),
        ),
      );
    });
}

describe("Payments UAT", () => {
  beforeEach(() => {
    establishUatSession();
  });

  it("records a payment against a folio", () => {
    prepareFolio(1).then((ctx) => {
      getUatFolio(ctx.token, ctx.folioId).then((before) => {
        cy.visit("/payments");

        cy.get('[data-testid="payments-folio-id"]')
          .clear()
          .type(String(ctx.folioId));

        cy.get('[data-testid="load-payments"]').click();

        cy.get('[data-testid="payment-amount"]').type("1000");
        cy.get('[data-testid="payment-method"]').select("upi");
        cy.get('[data-testid="record-payment"]').click();

        cy.contains("Payment recorded.").should("be.visible");

        cy.get('[data-testid^="payment-row-"]')
          .should("contain", "1,000.00")
          .and("contain", "upi")
          .and("contain", "completed");

        getUatFolio(ctx.token, ctx.folioId).then((after) => {
          expect(Number(after.paid_amount)).to.eq(
            Number(before.paid_amount) + 1000,
          );
          expect(Number(after.balance_due)).to.eq(
            Number(before.balance_due) - 1000,
          );
        });
      });
    });
  });

  it("rejects an overpayment", () => {
    prepareFolio(2).then((ctx) => {
      cy.visit("/payments");

      cy.get('[data-testid="payments-folio-id"]')
        .clear()
        .type(String(ctx.folioId));

      cy.get('[data-testid="load-payments"]').click();

      cy.get('[data-testid="payment-amount"]').type("999999");
      cy.get('[data-testid="record-payment"]').click();

      cy.contains("Payment exceeds outstanding balance.").should("be.visible");
    });
  });

  it("voids a completed payment and restores the balance", () => {
    prepareFolio(3).then((ctx) => {
      createUatPayment(ctx.token, ctx.folioId, 1000).then((payment) => {
        getUatFolio(ctx.token, ctx.folioId).then((beforeVoid) => {
          cy.visit("/payments");

          cy.get('[data-testid="payments-folio-id"]')
            .clear()
            .type(String(ctx.folioId));

          cy.get('[data-testid="load-payments"]').click();

          cy.get(`[data-testid="payment-row-${payment.id}"]`)
            .should("contain", payment.payment_reference)
            .within(() => {
              cy.get(`[data-testid="void-payment-${payment.id}"]`).click();
            });

          cy.contains("Payment voided.").should("be.visible");

          cy.get(`[data-testid="payment-row-${payment.id}"]`).should(
            "contain",
            "voided",
          );

          getUatFolio(ctx.token, ctx.folioId).then((afterVoid) => {
            expect(Number(beforeVoid.paid_amount)).to.eq(1000);
            expect(Number(afterVoid.paid_amount)).to.eq(0);
            expect(Number(afterVoid.balance_due)).to.eq(
              Number(beforeVoid.grand_total),
            );
          });
        });
      });
    });
  });
});
