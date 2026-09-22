import {
  cancelUatCashVoucher,
  createUatCashVoucher,
  getUatCashVoucher,
} from "../support/uatFactory";
import { establishUatSession, loginUatAdmin } from "../support/uatApi";

describe("Cash Vouchers UAT", () => {
  beforeEach(() => {
    establishUatSession();
  });

  it("creates and lists a cash expense voucher", () => {
    loginUatAdmin().then((auth) => {
      createUatCashVoucher(auth.access_token, 1250).then((voucher) => {
        cy.visit("/vouchers");

        cy.get('[data-testid="voucher-search"]').should("be.visible");
        cy.get('[data-testid="cash-voucher-row-' + voucher.id + '"]')
          .should("contain", voucher.voucher_number)
          .and("contain", "1,250.00")
          .and("contain", "active");
      });
    });
  });

  it("opens, edits, and cancels a voucher", () => {
    loginUatAdmin().then((auth) => {
      createUatCashVoucher(auth.access_token, 850).then((voucher) => {
        cy.visit("/vouchers");

        cy.get('[data-testid="cash-voucher-row-' + voucher.id + '"]').click();

        cy.get('[data-testid="cash-voucher-detail"]')
          .should("contain", voucher.voucher_number)
          .and("contain", "850.00");

        cy.get('[data-testid="cash-voucher-detail"]')
          .contains("button", "Edit")
          .click();

        cy.get('[data-testid="cash-voucher-amount"]').clear().type("900");
        cy.contains("button", "Save Changes").click();

        cy.contains("Cash voucher updated.").should("be.visible");
        cy.get('[data-testid="cash-voucher-detail"]').should(
          "contain",
          "900.00",
        );

        cy.on("window:confirm", () => true);
        cy.get('[data-testid="cancel-cash-voucher-' + voucher.id + '"]').click();

        cy.contains("Cash voucher cancelled.").should("be.visible");
        cy.get('[data-testid="cash-voucher-row-' + voucher.id + '"]').should(
          "contain",
          "cancelled",
        );

        getUatCashVoucher(auth.access_token, voucher.id).then((after) => {
          expect(after.status).to.eq("cancelled");
          expect(Number(after.amount)).to.eq(900);
        });

        cancelUatCashVoucher(auth.access_token, voucher.id);
      });
    });
  });
});
