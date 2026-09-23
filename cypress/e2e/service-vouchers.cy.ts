import {
  createUatBooking,
  createUatFolio,
  createUatGuest,
  createUatRoom,
  getUatServiceVouchers,
} from "../support/uatFactory";
import { establishUatSession, loginUatAdmin } from "../support/uatApi";

describe("Service Vouchers UAT", () => {
  beforeEach(() => {
    establishUatSession();
  });

  it("creates a draft service voucher from a folio", () => {
    loginUatAdmin().then((auth) => {
      createUatGuest(auth.access_token).then((guest) => {
        createUatRoom(auth.access_token).then((room) => {
          createUatBooking(
            auth.access_token,
            guest.id,
            room.id,
            "2027-07-10",
            "2027-07-12",
          ).then((booking) => {
            createUatFolio(auth.access_token, booking.id).then((folio) => {
              cy.visit(`/folio?folioId=${folio.id}`);

              cy.contains("button", "Add Service")
                .should("be.visible")
                .click();

              cy.location("search").should(
                "contain",
                `tab=service&folioId=${folio.id}&action=create`,
              );

              cy.get('[data-testid="service-voucher-name"]')
                .should("be.visible")
                .type("Desert Safari");

              cy.get('[data-testid="service-voucher-description"]')
                .type("Evening camel safari");

              cy.get('[data-testid="service-voucher-quantity"]')
                .clear()
                .type("2");

              cy.get('[data-testid="service-voucher-unit-price"]')
                .type("850");

              cy.get('[data-testid="service-voucher-tax"]')
                .clear()
                .type("5");

              cy.get('[data-testid="save-service-voucher"]')
                .click();

              cy.get('[data-testid^="service-voucher-row-"]')
                .first()
                .should("contain", "Desert Safari")
                .and("contain", "1,785.00")
                .and("contain", "draft");

              cy.get('[data-testid="service-voucher-detail"]')
                .should("contain", "Desert Safari")
                .and("contain", "1,785.00");

              getUatServiceVouchers(auth.access_token).then((vouchers) => {
                const voucher = vouchers.find(
                  (item) =>
                    item.folio_id === folio.id &&
                    item.service_name === "Desert Safari",
                );

                expect(voucher).to.exist;
                expect(voucher?.status).to.eq("draft");
                expect(Number(voucher?.amount)).to.eq(1700);
                expect(Number(voucher?.tax_amount)).to.eq(85);
                expect(Number(voucher?.total_amount)).to.eq(1785);
              });
            });
          });
        });
      });
    });
  });
});
