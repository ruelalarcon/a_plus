/*
 * Test suite to ensure all authentication flows in the future work as expected
 */

describe("Authentication Spec", () => {
  const timestamp = new Date().getTime();
  const randomNumber = Math.floor(Math.random() * 1000);
  const testUser = {
    username: `testuser_${timestamp}_${randomNumber}`,
    password: "testPass123",
  };

  before(() => {
    // Reset database at the start of the test suite
    cy.request("GET", "/reset");
  });

  beforeEach(() => {
    // Clear all cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // Verify that registration fails when passwords don't match
  it("Test register with non-matching passwords", function () {
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(
      testUser.password + "incorrect"
    );
    cy.get('[data-test="register-submit-btn"]').click();
    cy.get("[data-description]").should(
      "include.text",
      "Passwords do not match"
    );
  });

  // Test username validation rules (special chars, length limits)
  it("Test register with invalid usernames", function () {
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username + "$");
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();
    cy.get("[data-description]").should("include.text", "underscores");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type("t");
    cy.get('[data-test="register-submit-btn"]').click();
    cy.get("[data-description]").should("include.text", "between 3 and 28");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(
      "abcdefghijklmnopqrstuvwxyz1234567890"
    );
    cy.get('[data-test="register-submit-btn"]').click();
    cy.get("[data-description]").should("include.text", "between 3 and 28");
  });

  // Test successful registration and access to protected routes
  it("Register user and access protected routes", function () {
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();
    cy.get('[data-test="page-title"]').should(
      "include.text",
      "Grade Calculators"
    );
    cy.get('[data-test="nav-link-my-courses"]').click();
    cy.get('[data-test="page-title"]').should("include.text", "Course Planner");
    cy.get('[data-test="logout-btn"]').click();
    cy.get('[href="/register"]').should("include.text", "Get Started");
  });

  // Verify that duplicate usernames are not allowed
  it("Test register with already taken username", function () {
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();
    cy.get("[data-description]").should(
      "include.text",
      "Username already exists"
    );
  });

  // Test login with previously registered user and verify protected route access
  it("Login with registered user and access protected routes", function () {
    cy.visit("/login");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="login-submit-btn"]').click();
    cy.get('[data-test="page-title"]').should(
      "include.text",
      "Grade Calculators"
    );
    cy.get('[data-test="nav-link-my-courses"]').click();
    cy.get('[data-test="page-title"]').should("include.text", "Course Planner");
    cy.get('[data-test="logout-btn"]').click();
    cy.get('[href="/register"]').should("include.text", "Get Started");
  });
});
