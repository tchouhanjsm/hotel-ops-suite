import {
  createUatBooking,
  createUatFolio,
  createUatGuest,
  createUatInvoice,
  createUatRoom,
  finalizeUatInvoice,
  voidUatInvoice,
} from "../support/uatFactory";
import { establishUatSession, loginUatAdmin } from "../support/uatApi";

function futureDates(offset = 0): { checkIn: string; checkOut: string } {
  const start = new Date();
  start.setDate(start.getDate() + 60 + offset);

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const format = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

  return { checkIn: format(start), checkOut: format(end) };
}

function prepareInvoice(): Cypress.Chainable<{
  token: string;
  invoiceId: number;
  invoiceNumber: string;
  folioId: number;
}> {
  return loginUatAdmin().then((auth) => {
    const { checkIn, checkOut } = futureDates();

    return createUatGuest(auth.access_token).then((guest) =>
      createUatRoom(auth.access_token).then((room) =>
        createUatBooking(
          auth.access_token,
          guest.id,
          room.id,
          checkIn,
          checkOut,
        ).then((booking) =>
          createUatFolio(auth.access_token, booking.id).then((folio) =>
            createUatInvoice(auth.access_token, folio.id).then((invoice) => ({
              token: auth.access_token,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              folioId: folio.id,
            })),
          ),
        ),
      ),
    );
  });
}

describe("Invoices UAT", () => {
  beforeEach(() => {
    establishUatSession();
  });

  it("loads the invoices workspace", () => {
    cy.visit("/invoices");

    cy.contains("h1", "Invoices").should("be.visible");
    cy.contains("button", "New Invoice").should("be.visible");
    cy.get('input[placeholder*="Search invoice"]').should("be.visible");
  });

  it("opens the create invoice form", () => {
    cy.visit("/invoices");

    cy.contains("button", "New Invoice").click();

    cy.contains("New Invoice").should("be.visible");
    cy.get('[data-testid="invoice-folio-id"]').should("be.visible");
  });

  it("loads a created draft invoice", () => {
    prepareInvoice().then((ctx) => {
      cy.visit("/invoices");

      cy.get('input[placeholder*="Search invoice"]')
        .clear()
        .type(ctx.invoiceNumber);

      cy.contains(ctx.invoiceNumber).should("be.visible");
      cy.contains("Draft").should("be.visible");
    });
  });

  it("finalizes a draft invoice", () => {
    prepareInvoice().then((ctx) => {
      cy.visit("/invoices");

      cy.get('input[placeholder*="Search invoice"]')
        .clear()
        .type(ctx.invoiceNumber);

      cy.contains(ctx.invoiceNumber).should("be.visible");
      cy.get(`[data-testid="invoice-row-${ctx.invoiceId}"]`).within(() => {
        cy.contains("button", "Open").click();
      });

      cy.contains("button", "Finalize").click();
      cy.on("window:confirm", () => true);
      cy.contains("Finalized").should("be.visible");
    });
  });

  it("voids a finalized invoice", () => {
    prepareInvoice().then((ctx) => {
      finalizeUatInvoice(ctx.token, ctx.invoiceId).then(() => {
        cy.visit("/invoices");

        cy.get('input[placeholder*="Search invoice"]')
          .clear()
          .type(ctx.invoiceNumber);

        cy.get(`[data-testid="invoice-row-${ctx.invoiceId}"]`).within(() => {
          cy.contains("button", "Open").click();
        });

        cy.contains("button", "Void Invoice").click();
        cy.on("window:confirm", () => true);
        cy.contains("Void").should("be.visible");
      });
    });
  });

  it("supports folio context for invoice creation", () => {
    prepareInvoice().then((ctx) => {
      cy.visit(`/invoices?folioId=${ctx.folioId}`);
      cy.contains("New Invoice").should("be.visible");
      cy.get('[data-testid="invoice-folio-id"]').should("be.visible");
    });
  });
});
