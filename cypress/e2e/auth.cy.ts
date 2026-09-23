describe("Authentication UAT", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirects unauthenticated users to login", () => {
    cy.visit("/dashboard");

    cy.url().should("include", "/login");
    cy.contains("h2", "Welcome back").should("be.visible");
    cy.get('input[autocomplete="username"]').should("be.visible");
    cy.get('input[autocomplete="current-password"]').should("be.visible");
  });

  it("logs in through the UI and restores the session after refresh", () => {
    cy.env(["UAT_ADMIN_USERNAME", "UAT_ADMIN_PASSWORD"]).then(
      ({ UAT_ADMIN_USERNAME, UAT_ADMIN_PASSWORD }) => {
        if (
          typeof UAT_ADMIN_USERNAME !== "string" ||
          typeof UAT_ADMIN_PASSWORD !== "string" ||
          UAT_ADMIN_USERNAME.trim() === "" ||
          UAT_ADMIN_PASSWORD.trim() === ""
        ) {
          throw new Error(
            "UAT_ADMIN_USERNAME and UAT_ADMIN_PASSWORD must be configured.",
          );
        }

        cy.visit("/login");

        cy.get('input[autocomplete="username"]')
          .type(UAT_ADMIN_USERNAME);

        cy.get('input[autocomplete="current-password"]')
          .type(UAT_ADMIN_PASSWORD);

        cy.contains("button", "Sign in").click();

        cy.url().should("include", "/dashboard");
        cy.contains("Hotel Operations").should("be.visible");

        cy.reload();

        cy.url().should("include", "/dashboard");
        cy.contains("Hotel Operations").should("be.visible");
      },
    );
  });

  it("logs out and protects the application again", () => {
    cy.env(["UAT_ADMIN_USERNAME", "UAT_ADMIN_PASSWORD"]).then(
      ({ UAT_ADMIN_USERNAME, UAT_ADMIN_PASSWORD }) => {
        if (
          typeof UAT_ADMIN_USERNAME !== "string" ||
          typeof UAT_ADMIN_PASSWORD !== "string" ||
          UAT_ADMIN_USERNAME.trim() === "" ||
          UAT_ADMIN_PASSWORD.trim() === ""
        ) {
          throw new Error(
            "UAT_ADMIN_USERNAME and UAT_ADMIN_PASSWORD must be configured.",
          );
        }

        cy.visit("/login");

        cy.get('input[autocomplete="username"]')
          .type(UAT_ADMIN_USERNAME);

        cy.get('input[autocomplete="current-password"]')
          .type(UAT_ADMIN_PASSWORD);

        cy.contains("button", "Sign in").click();

        cy.url().should("include", "/dashboard");

        cy.get('button[aria-label="Sign out"]')
          .should("be.visible")
          .click();

        cy.url().should("include", "/login");

        cy.visit("/dashboard");
        cy.url().should("include", "/login");
      },
    );
  });
});
