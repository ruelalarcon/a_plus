/*
 * Test suite for interactions with the command palette.
 * Covers user story two for "Hacker Man Sam."
 */

describe("Command Palette Spec", () => {
  const timestamp = new Date().getTime();
  const randomNumber = Math.floor(Math.random() * 1000);
  const testUser = {
    username: `testuser_${timestamp}_${randomNumber}`,
    password: "testPass123",
  };

  beforeEach(() => {
    // Clear all cookies, local storage, and database data before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.request("GET", "/reset");
  });

  it("Test command palette functions", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    /* ==== Generated with Cypress Studio ==== */
    cy.get('[data-test="command-palette-btn"] > :nth-child(2)').click();
    cy.get(
      '[data-test="create-calculator-item"] > .justify-between > .flex > span'
    ).click();
    cy.get('[data-test="new-calculator-name-input"]').type("Test 1");
    cy.get('[data-test="confirm-create-calculator"]').click();
    cy.get('[data-test="command-palette-btn"]').click();
    cy.get('[data-test="add-course-item"] > .justify-between').click();
    cy.get('[data-test="new-course-name-input"]').clear();
    cy.get('[data-test="new-course-name-input"]').type("CMPT140");
    cy.get('[data-test="confirm-create-course"]').click();
    cy.get('[data-test="course-name"]').should("have.text", "CMPT140");
    cy.get('[data-test="course-status"] > .text-sm').should(
      "have.text",
      "Incomplete"
    );
    cy.get('[data-test="credits-completion"] > :nth-child(2)').should(
      "have.text",
      "0 / 3"
    );
    cy.get('[data-test="total-courses-stat"] > .text-2xl').should(
      "have.text",
      "1"
    );
    cy.get('[data-test="command-palette-btn"]').click();
    cy.get('[data-test="open-calculator-item"]').click();
    cy.get('[data-test="calculator-item"] > .justify-between').should(
      "have.text",
      " Test 1 "
    );
    cy.get('[data-test="calculator-item"] > .justify-between').click();
    cy.get('[data-test="calculator-title"]').should("have.text", " Test 1 ");
    cy.get('[data-test="add-first-assessment-btn"]').click();
    cy.get('[data-test="assessment-name-input-0"]').type("quiz");
    cy.get('[data-test="publish-template-btn"]').click();
    cy.get('[data-test="template-term-input"]').clear("Fall");
    cy.get('[data-test="template-term-input"]').type("Fall");
    cy.get('[data-test="template-institution-input"]').clear("USASK");
    cy.get('[data-test="template-institution-input"]').type("USASK");
    cy.get('[data-test="confirm-publish-btn"]').click();
    cy.get(".h-8 > .h-full").click();
    cy.get('[data-test="command-palette-btn"] > :nth-child(2)').click();
    cy.get('[data-test="search-templates-item"]').click();
    cy.get('[data-test="template-search-input"]').clear();
    cy.get('[data-test="template-search-input"]').type("Test");
    cy.get('[data-test="confirm-template-search"]').click();
    cy.get('[data-test="template-name"]').should("have.text", "Test 1");
    /* ==== End Cypress Studio ==== */
  });
});
