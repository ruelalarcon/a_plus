/*
 * Test suite to ensure all calculator functionality works as expected. This
 * suite fully covers the two user stories provided by "Helpful Business Student
 * Harry", user story one provided by "Smart Alex", and user story two provided
 * by "Micheal Minimal Effort." (Search is covered by unit tests), this suite
 * simply need verify that the template library correctly loads templates.
 */

describe("Calulator Spec", () => {
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

  it("Test grade calculator creation and redirection", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Create a new calculator
    cy.get('[data-test="create-calculator-btn"]').should(
      "include.text",
      "Create New Calculator"
    );
    cy.get('[data-test="create-calculator-btn"]').click();
    cy.get('[data-test="calculator-name-input"]').clear();
    cy.get('[data-test="calculator-name-input"]').type(
      "Test Calculator " + randomNumber
    );
    cy.get('[data-test="confirm-create-btn"]').click();

    // Verify that the calculator page is loaded with the new calculator name
    cy.get('[data-test="calculator-title"]').should(
      "include.text",
      " Test Calculator " + randomNumber
    );
    cy.get('[data-test="no-assessments-message"]').should(
      "include.text",
      "No assessments added yet."
    );
  });

  it("Test assessment creation and saving", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Create a new calculator
    cy.get('[data-test="create-calculator-btn"]').click();
    cy.get('[data-test="calculator-name-input"]').clear();
    cy.get('[data-test="calculator-name-input"]').type(
      "Test Calculator " + randomNumber
    );
    cy.get('[data-test="confirm-create-btn"]').click();

    // Wait for calculator page to load
    cy.get('[data-test="calculator-title"]').should(
      "include.text",
      " Test Calculator " + randomNumber
    );
    // Wait for javascript to load
    cy.get('[data-test="no-assessments-message"]').should(
      "include.text",
      "No assessments added yet."
    );

    // Add an assessment (Name: Example, with weight 50%)
    cy.get('[data-test="add-first-assessment-btn"]').click();

    cy.get('[data-test="assessment-name-input-0"]').clear();
    cy.get('[data-test="assessment-name-input-0"]').type("Example");
    cy.get('[data-test="assessment-weight-input-0"]').clear();
    cy.get('[data-test="assessment-weight-input-0"]').type("50");

    // Hit the save button
    cy.get('[data-test="save-calculator-btn"]').click();

    // Verify that the changes were saved successfully
    cy.get('[data-content=""] > div').should(
      "include.text",
      "Changes saved successfully!"
    );

    // Navigate back to the home/calculators page
    cy.get('[data-test="back-button"]').click();

    // Verify that the page title is correct
    cy.get('[data-test="page-title"]').should(
      "include.text",
      "Grade Calculators"
    );

    // Verify that the calculator was created
    cy.get('[data-test="calculator-name"]').should(
      "include.text",
      "Test Calculator " + randomNumber
    );

    // Open the calculator
    cy.get('[data-test="open-calculator-btn"] > span').click();

    // Ensure that the assessment name was saved correctly
    cy.get('[data-test="assessment-name-input-0"]').should(
      "have.value",
      "Example"
    );

    // Enter a new grade for Example assessment (69%)
    cy.get('[data-test="assessment-grade-input-0"]').clear();
    cy.get('[data-test="assessment-grade-input-0"]').type("69");

    // Save and verify that save message appeared
    cy.get('[data-test="save-calculator-btn"]').click();
    cy.get('[data-content=""] > div').should(
      "include.text",
      "Changes saved successfully!"
    );

    // Navigate back to the home/calculators page
    cy.get('[data-test="back-button"]').click();

    // Verify that the final grade is correct
    cy.get('[data-test="final-grade"]').should("include.text", "69.00%");
  });

  it("Ensure that warning for non-100% sum appears", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Create a new calculator
    cy.get('[data-test="create-calculator-btn"]').click();
    cy.get('[data-test="calculator-name-input"]').clear();
    cy.get('[data-test="calculator-name-input"]').type(
      "Test Calculator " + randomNumber
    );
    cy.get('[data-test="confirm-create-btn"]').click();

    // Wait for calculator page to load
    cy.get('[data-test="calculator-title"]').should(
      "include.text",
      " Test Calculator " + randomNumber
    );
    // Wait for javascript to load
    cy.get('[data-test="no-assessments-message"]').should(
      "include.text",
      "No assessments added yet."
    );

    // Add an assessment (Name: Example, with weight 50%)
    cy.get('[data-test="add-first-assessment-btn"]').click();
    cy.get('[data-test="assessment-name-input-0"]').clear();
    cy.get('[data-test="assessment-name-input-0"]').type("Example");
    cy.get('[data-test="assessment-weight-input-0"]').clear();
    cy.get('[data-test="assessment-weight-input-0"]').type("50");

    // Ensure warning banner appears
    cy.get('[data-test="weight-warning"]').should(
      "include.text",
      "should total 100%."
    );

    // Change the assessment weight to 100%
    cy.get('[data-test="assessment-weight-input-0"]').clear();
    cy.get('[data-test="assessment-weight-input-0"]').type("100");

    // Ensure warning banner no longer appears
    cy.get('[data-test="weight-warning"]').should("not.exist");
  });

  it("Create grade breakdown and verify all output values with various inputs", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Create a new calculator
    cy.get('[data-test="create-calculator-btn"]').click();
    cy.get('[data-test="calculator-name-input"]').clear();
    cy.get('[data-test="calculator-name-input"]').type(
      "Test Calculator " + randomNumber
    );
    cy.get('[data-test="confirm-create-btn"]').click();

    // Wait for calculator page to load
    cy.get('[data-test="calculator-title"]').should(
      "include.text",
      " Test Calculator " + randomNumber
    );
    // Wait for javascript to load
    cy.get('[data-test="no-assessments-message"]').should(
      "include.text",
      "No assessments added yet."
    );

    // Add an assessment (Assignment 1) with a weight of 50% and a grade of 70%
    cy.get('[data-test="add-first-assessment-btn"]').click();
    cy.get('[data-test="assessment-name-input-0"]').clear();
    cy.get('[data-test="assessment-name-input-0"]').type("Assignment 1");
    cy.get('[data-test="assessment-weight-input-0"]').clear();
    cy.get('[data-test="assessment-weight-input-0"]').type("50");
    cy.get('[data-test="assessment-grade-input-0"]').clear();
    cy.get('[data-test="assessment-grade-input-0"]').type("60");

    // You should have a 60% at this point due to there being only one assessment
    cy.get('[data-test="current-grade"]').should("include.text", "60.00%");

    // Should be above the target grade (default target is 50%)
    cy.get('[data-test="grade-status"]').should(
      "include.text",
      "Above target grade"
    );

    // Set the target grade to 80%
    cy.get('[data-test="min-desired-grade-input"]').clear();
    cy.get('[data-test="min-desired-grade-input"]').type("80");

    // We are now below our target grade of 80%
    cy.get('[data-test="grade-status"]').should(
      "include.text",
      "Below target grade"
    );

    // No other assessments to be graded
    cy.get('[data-test="target-status"]').should(
      "include.text",
      "All assessments graded"
    );

    // Add a second assessment (Final) with a weight of 50% and a grade of 90%
    cy.get('[data-test="add-assessment-btn"]').click();
    cy.get('[data-test="assessment-name-input-1"]').clear();
    cy.get('[data-test="assessment-name-input-1"]').type("Final");
    cy.get('[data-test="assessment-weight-input-1"]').clear();
    cy.get('[data-test="assessment-weight-input-1"]').type("50");

    // The target is mathematically possible
    cy.get('[data-test="target-status"]').should(
      "include.text",
      "Target is mathematically possible"
    );

    // We got a 90% on the final
    cy.get('[data-test="assessment-grade-input-1"]').clear();
    cy.get('[data-test="assessment-grade-input-1"]').type("90");

    // You should now have a 75%
    cy.get('[data-test="current-grade"]').should("include.text", "75.00%");

    // Test with other values
    cy.get('[data-test="assessment-grade-input-0"]').clear();
    cy.get('[data-test="assessment-grade-input-0"]').type("30");
    cy.get('[data-test="current-grade"]').should("include.text", "60.00%");
    cy.get('[data-test="assessment-grade-input-1"]').clear();

    // The target is not mathematically possible now
    cy.get('[data-test="target-status"]').should(
      "include.text",
      "Target requires >100% on remaining work"
    );
  });

  it("Test assessment publishing for calculator template", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Create a new calculator
    cy.get('[data-test="create-calculator-btn"]').click();
    cy.get('[data-test="calculator-name-input"]').clear();
    cy.get('[data-test="calculator-name-input"]').type(
      "Test Calculator " + randomNumber
    );
    cy.get('[data-test="confirm-create-btn"]').click();

    // Wait for calculator page to load
    cy.get('[data-test="calculator-title"]').should(
      "include.text",
      " Test Calculator " + randomNumber
    );
    // Wait for javascript to load
    cy.get('[data-test="no-assessments-message"]').should(
      "include.text",
      "No assessments added yet."
    );

    // Add an assessment (Name: Example, with weight 50%)
    cy.get('[data-test="add-first-assessment-btn"]').click();
    cy.get('[data-test="assessment-name-input-0"]').clear();
    cy.get('[data-test="assessment-name-input-0"]').type("Example");
    cy.get('[data-test="assessment-weight-input-0"]').clear();
    cy.get('[data-test="assessment-weight-input-0"]').type("50");

    // Hit the save button
    cy.get('[data-test="save-calculator-btn"]').click();

    // Verify that the changes were saved successfully
    cy.get('[data-content=""] > div').should(
      "include.text",
      "Changes saved successfully!"
    );

    // Publish the calculator as a template "Test Template"
    cy.get('[data-test="publish-template-btn"]').click();
    cy.get('[data-test="template-name-input"]').clear();
    cy.get('[data-test="template-name-input"]').type("Test Template");
    cy.get('[data-test="template-term-input"]').clear();
    cy.get('[data-test="template-term-input"]').type("Winter");
    cy.get('[data-test="template-institution-input"]').clear();
    cy.get('[data-test="template-institution-input"]').type("Test University");
    cy.get('[data-test="confirm-publish-btn"]').click();

    // Ensure that the template was published successfully
    cy.get('[data-content=""] > div').should(
      "include.text",
      "Template published successfully!"
    );

    // Navigate to the template library and verify that the template was created
    cy.get('[data-test="back-button"]').click();
    cy.get('[data-test="nav-link-search-templates"]').click();
    cy.get('[data-test="page-title"]').should(
      "include.text",
      "Template Library"
    );
    cy.get('[data-test="template-name"]').should(
      "include.text",
      "Test Template"
    );

    // Use the template and verify that the calculator was created
    cy.get('[data-test="use-template-btn"]').click();
    cy.get('[data-test="calculator-title"]').should(
      "include.text",
      " Test Template "
    );
    cy.get('[data-test="assessment-name-input-0"]').should(
      "have.value",
      "Example"
    );
    cy.get('[data-test="back-button"]').click();
    cy.get('[data-test="page-title"]').should(
      "include.text",
      "Grade Calculators"
    );
    cy.get('[data-test="calculator-name"]').should(
      "include.text",
      "Test Template"
    );
  });
});
