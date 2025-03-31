describe("Complete Authentication Flow", () => {
  // Use a timestamp to create unique test users
  const timestamp = new Date().getTime();
  const testUser = {
    username: `testuser_${timestamp}`,
    password: "securePass123",
  };

  beforeEach(() => {
    // Clear all cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("should show landing page for unauthenticated users", () => {
    cy.visit("/");

    // Verify landing page elements
    cy.contains("The smart way to track your grades").should("be.visible");
    cy.contains("Get Started").should("be.visible");
    cy.contains("Sign In").should("be.visible");
  });

  it("should navigate from landing to login page", () => {
    cy.visit("/");
    cy.contains("Sign In").click();

    // Verify we're on the login page
    cy.url().should("include", "/login");
    cy.contains("h1", "Login").should("be.visible");
  });

  it("should navigate from login to register page", () => {
    cy.visit("/login");
    cy.contains("Register").click();

    // Verify we're on the register page
    cy.url().should("include", "/register");
    cy.contains("h1", "Register").should("be.visible");
  });

  it("should fail login with invalid credentials", () => {
    // Visit the login page
    cy.visit("/login");

    // Verify we're on the login page
    cy.contains("h1", "Login").should("be.visible");

    // Enter invalid credentials
    cy.get('input[name="username"]').type("invaliduser");
    cy.get('input[name="password"]').type("wrongpassword");

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Check for error toast
    cy.contains("Login failed").should("be.visible");
  });

  it("should fail validation on register with mismatched passwords", () => {
    cy.visit("/register");

    // Fill form with mismatched passwords
    cy.get('input[id="username"]').type(testUser.username);
    cy.get('input[id="password"]').type(testUser.password);
    cy.get('input[id="confirm-password"]').type(testUser.password + "1");

    // Submit form
    cy.get('button[type="submit"]').click();

    // Should show validation error
    cy.contains("Password validation failed").should("be.visible");
    cy.contains("Passwords do not match").should("be.visible");
  });

  it("should successfully register a new user and redirect to login", () => {
    // Use our custom command to register
    cy.register(testUser.username, testUser.password);

    // Should be redirected to login page
    cy.url().should("include", "/login");

    // Should show success message
    cy.contains("Registration successful").should("be.visible");
  });

  it("should successfully login and access protected routes", () => {
    // Use our custom command to login
    cy.login(testUser.username, testUser.password);

    // Should redirect to calculators page
    cy.url().should("not.include", "/login");

    // Should show authenticated UI
    cy.contains("My Calculators").should("be.visible");
    cy.contains("Create Calculator").should("be.visible");

    // Verify we can navigate to other protected routes
    cy.contains("My Courses").click();
    cy.url().should("include", "/courses");

    // Try navigating to profile
    cy.contains("My Profile").click();
    cy.url().should("include", "/user/");
  });

  it("should logout and redirect to index page", () => {
    // Login first
    cy.login(testUser.username, testUser.password);

    // Find and click logout button
    cy.contains("Logout").click();

    // Should redirect to index page
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    // Verify we see landing page elements
    cy.contains("The smart way to track your grades").should("be.visible");
    cy.contains("Get Started").should("be.visible");
    cy.contains("Sign In").should("be.visible");

    // Verify we're logged out by trying to access a protected route
    cy.visit("/calculators");
    cy.url().should("include", "/login");
  });
});
