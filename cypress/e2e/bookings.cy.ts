describe("Bookings UAT", () => {
  beforeEach(() => {
    cy.visit("/login");

    cy.get('input[autocomplete="username"]')
      .clear()
      .type("admin");

    cy.get('input[autocomplete="current-password"]')
      .clear()
      .type("admin");

    cy.contains("button", "Sign in").click();

    cy.url().should("include", "/dashboard");
  });

  it("loads the bookings page", () => {
    cy.visit("/bookings");

    cy.contains("h1", "Bookings").should("be.visible");
    cy.get('input[placeholder*="Search booking"]').should("be.visible");
    cy.contains("button", "New Booking").should("be.visible");
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

    cy.contains("h2", "New Booking").should("be.visible");
    cy.contains("Guest").should("be.visible");
    cy.contains("Room").should("be.visible");
    cy.contains("Check-in").should("be.visible");
    cy.contains("Check-out").should("be.visible");
    cy.contains("Nightly rate").should("be.visible");
  });

  it("creates a booking", () => {
    cy.visit("/bookings");

    cy.contains("button", "New Booking").click();

    cy.contains("h2", "New Booking").should("be.visible");

    // Guest
    cy.get("select")
      .filter(":visible")
      .first()
      .should("be.visible")
      .select("1");

    // Room
    cy.get("select")
      .filter(":visible")
      .eq(1)
      .should("be.visible")
      .select("1");

    // Dates
    cy.get('input[type="date"]')
      .filter(":visible")
      .first()
      .clear()
      .type("2027-06-10");

    cy.get('input[type="date"]')
      .filter(":visible")
      .eq(1)
      .clear()
      .type("2027-06-12");

    // Rate
    cy.get('input[type="number"]')
      .filter(":visible")
      .first()
      .clear()
      .type("4900");

    // Source
    cy.get("select")
      .filter(":visible")
      .eq(2)
      .select("direct");

    cy.contains("button", "Create Booking")
      .should("be.visible")
      .click();

    cy.contains("created.").should("be.visible");
  });

  it("rejects an unavailable room/date combination", () => {
    cy.visit("/bookings");

    cy.contains("button", "New Booking").click();

    cy.get("select")
      .filter(":visible")
      .first()
      .select("1");

    cy.get("select")
      .filter(":visible")
      .eq(1)
      .select("1");

    cy.get('input[type="date"]')
      .filter(":visible")
      .first()
      .clear()
      .type("2027-06-10");

    cy.get('input[type="date"]')
      .filter(":visible")
      .eq(1)
      .clear()
      .type("2027-06-12");

    cy.get('input[type="number"]')
      .filter(":visible")
      .first()
      .clear()
      .type("4900");

    cy.contains("button", "Create Booking").click();

    cy.contains("Room is not available for the selected dates.")
      .should("be.visible");
  });

  it("checks a confirmed booking in", () => {
    cy.visit("/bookings");

    cy.contains("button", "Check in")
      .first()
      .should("be.visible")
      .click();

    cy.contains("checked in.").should("be.visible");
    cy.contains("checked in").should("be.visible");
  });

  it("checks an in-house booking out", () => {
    cy.visit("/bookings");

    cy.contains("button", "Check out")
      .first()
      .should("be.visible")
      .click();

    cy.contains("checked out.").should("be.visible");
    cy.contains("checked out").should("be.visible");
  });

  it("cancels a confirmed booking", () => {
    cy.visit("/bookings");

    cy.contains("button", "Cancel")
      .first()
      .should("be.visible")
      .click();

    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Cancel booking");
      return true;
    });

    cy.contains("cancelled.").should("be.visible");
    cy.contains("cancelled").should("be.visible");
  });

  it("searches for a cancelled booking", () => {
    cy.visit("/bookings");

    cy.get('input[placeholder*="Search booking"]')
      .clear()
      .type("cancelled");

    cy.contains("cancelled").should("be.visible");
  });
});
