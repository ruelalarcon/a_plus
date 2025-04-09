/*
 * Test suite for interactions with public templates.
 * Covers both user stories by "Ranch Boy Rick".
 */

describe("Templates Spec", () => {
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

  it("Test commenting on a function", function () {
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

    // Viewing empty comment section
    cy.get('[data-test="vote-count"]').should("have.text", "1");
    cy.get('[data-test="view-comments-btn"]').click();
    cy.get('[data-test="no-comments-message"]').should(
      "have.text",
      "No comments yet. Be the first to comment!"
    );

    // Adding a comment
    cy.get('[data-test="new-comment-textarea"]').click();
    cy.get('[data-test="new-comment-textarea"]').type("comment");
    cy.get('[data-test="comments-sheet-body"]').click();
    cy.get('[data-test="post-comment-btn"]').click();
    cy.get('[data-test="comment-content"]').should("have.text", "comment");
    cy.get('[data-test="comment-card"] > .flex-col > .font-semibold').should(
      "include.text",
      testUser.username
    );

    // Editing a comment
    cy.get('[data-test="edit-comment-btn"]').click();
    cy.get('[data-test="comment-edit-textarea"]').click();
    cy.get('[data-test="comment-edit-textarea"]').type(" edited");
    cy.get('[data-test="save-edit-btn"]').click();
    cy.get('[data-test="comment-content"]').should(
      "have.text",
      "comment edited"
    );

    // Deleting a comment
    cy.get('[data-test="delete-comment-btn"]').click();
    cy.get('[data-test="confirm-delete-comment-btn"]').click();
    cy.get('[data-test="no-comments-message"]').should(
      "have.text",
      "No comments yet. Be the first to comment!"
    );
  });

  it("Test upvoting another user's template", function () {
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

    // Log out of first user
    cy.get('[data-test="logout-btn"]').click();
    cy.get('.pt-4 > [href="/register"] > .ring-offset-background').click();

    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username + "2");
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Test upvote button
    cy.get(
      '[data-test="nav-link-search-templates"] > .ring-offset-background'
    ).click();
    cy.get('[data-test="upvote-btn"]').click();
    cy.get('[d="M7 10v12"]').should("have.attr", "d", "M7 10v12");
    cy.get('[data-test="vote-count"]').click();
    cy.get('[data-test="vote-count"]').click();
    cy.get('[data-test="vote-count"]').should("have.text", "2");
    cy.get(
      '[data-test="template-card"] > .flex-col > .justify-between'
    ).click();
    cy.get('[data-test="upvote-btn"]').click();
    cy.get('[data-test="vote-count"]').should("have.text", "1");

    // Test downvote button
    cy.get('[data-test="downvote-btn"] > .lucide-icon').click();
    cy.get('[data-test="vote-count"]').should("have.text", "0");
    cy.get('[data-test="nav-my-profile"]').click();
    cy.get(
      '[data-test="nav-link-search-templates"] > .ring-offset-background'
    ).click();
    cy.get('[data-test="vote-count"]').should("have.text", "0");

    // Upvote after downvoting (so that it doesn't increment but adjusts original value)
    cy.get('[data-test="upvote-btn"]').click();
    cy.get('[data-test="vote-count"]').should("have.text", "2");
  });
});
