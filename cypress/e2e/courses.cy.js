/*
 * Test suite to ensure all course tracking functionality works as expected.
 * This suite fully covers the two user stories provided by "Smart Alex".
 */

describe("Courses Spec", () => {
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

  it("Test adding and removing courses", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Add course
    cy.get(
      '[data-test="nav-link-my-courses"] > .ring-offset-background'
    ).click();
    cy.get('[data-test="empty-all-message"]').should(
      "have.text",
      "No courses added yet. Add your first course to get started!"
    );
    cy.get('[data-test="course-name-input"]').clear("M");
    cy.get('[data-test="course-name-input"]').type("MATH101");
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="course-name"]').should("have.text", "MATH101");
    cy.get('[data-test="course-status"] > .text-sm').should(
      "have.text",
      "Incomplete"
    );
    cy.get('[data-test="status-badge"]').should("have.text", "In Progress");

    // Change completion
    cy.get('[data-test="complete-checkbox"] > .flex').click();
    cy.get('[data-test="course-status"] > .text-sm').should(
      "have.text",
      "Completed"
    );
    cy.get('[data-test="status-badge"]').should("have.text", "Completed");
    cy.get('[data-test="complete-checkbox"] > .flex > .lucide-icon').click();
    cy.get('[data-test="course-status"] > .text-sm').should(
      "have.text",
      "Incomplete"
    );
    cy.get('[data-test="status-badge"]').should("have.text", "In Progress");

    // Delete course
    cy.get('[data-test="delete-course-btn-1"] > .lucide-icon').click();
    cy.get('[data-test="confirm-delete-btn"]').click();
    cy.get('[data-test="empty-all-message"]').should(
      "have.text",
      "No courses added yet. Add your first course to get started!"
    );
    cy.get('[data-test="empty-state"]').click();
    cy.get('[data-test="add-course-btn"]').click();
    cy.get(".pt-0").click();
    cy.get('[data-test="course-name-input"]').click();
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="empty-all-message"]').should(
      "have.text",
      "No courses added yet. Add your first course to get started!"
    );
    cy.get('[data-test="course-name-input"]').clear();
  });

  it("Test credit values being correct", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Check credit values
    cy.get(
      '[data-test="nav-link-my-courses"] > .ring-offset-background'
    ).click();
    cy.get('[data-test="course-name-input"]').type("PSY121");
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="courses-completion"] > :nth-child(2)').should(
      "have.text",
      "0 / 1"
    );
    cy.get('[data-test="credits-completion"] > :nth-child(2)').should(
      "have.text",
      "0 / 3"
    );
    cy.get('[data-test="complete-checkbox"]').click();
    cy.get('[data-test="courses-completion"] > :nth-child(2)').should(
      "have.text",
      "1 / 1"
    );
    cy.get('[data-test="credits-completion"] > :nth-child(2)').should(
      "have.text",
      "3 / 3"
    );

    // Check credit values with courses that have >3
    cy.get('[data-test="course-name-input"]').clear("P");
    cy.get('[data-test="course-name-input"]').type("PSY213");
    cy.get('[data-test="course-credits-input"]').click();
    cy.get('[data-test="course-credits-input"]').clear("6");
    cy.get('[data-test="course-credits-input"]').type("6");
    cy.get('[data-test="prerequisite-checkbox"]').click();
    cy.get('[data-test="add-course-btn"]').click();
    cy.get(
      '[data-course-id="2"] > .flex-col > .justify-between > .flex-1 > [data-test="course-credits"]'
    ).should("have.text", "6 Credits");
    cy.get(
      '[data-course-id="2"] > :nth-child(2) > .space-y-4 > .justify-between > .gap-2'
    ).click();
    cy.get('[data-test="credits-completion"] > :nth-child(2)').should(
      "have.text",
      "9 / 9"
    );
    cy.get('[data-test="courses-completion"] > :nth-child(2)').should(
      "have.text",
      "2 / 2"
    );
    cy.get('[data-test="total-courses-stat"] > .text-2xl').should(
      "have.text",
      "2"
    );
    cy.get('[data-test="completed-courses-stat"] > .text-2xl').should(
      "have.text",
      "2"
    );
    cy.get('[data-test="total-credits-stat"] > .text-2xl').should(
      "have.text",
      "9"
    );
  });

  it("Test prerequisite linking", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Ass prerequisite courses
    cy.get(
      '[data-test="nav-link-my-courses"] > .ring-offset-background'
    ).click();
    cy.get('[data-test="course-name-input"]').type("PSY121");
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="course-name-input"]').clear();
    cy.get('[data-test="course-name-input"]').type("PSY213");
    cy.get(
      ':nth-child(1) > [data-test="prerequisite-checkbox"] > .flex'
    ).click();
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="course-credits-input"]').click();

    // Check prerequisite linking
    cy.get('[data-test="course-name-input"]').clear();
    cy.get('[data-test="course-name-input"]').type("PSY214");
    cy.get(
      ':nth-child(1) > [data-test="prerequisite-checkbox"] > .flex'
    ).click();
    cy.get(
      ':nth-child(2) > [data-test="prerequisite-checkbox"] > .flex'
    ).click();
    cy.get('[data-test="add-course-btn"]').click();
    cy.get(
      '[data-course-id="3"] > :nth-child(2) > .space-y-4 > [data-test="prerequisites-section"]'
    ).should("have.text", "\r\n            Prerequisites PSY121, PSY213");
    cy.get(
      '[data-course-id="3"] > .mt-auto > [data-test="prerequisites-badge"]'
    ).should("have.text", "2 Prerequisites");
    cy.get(
      '[data-course-id="2"] > .mt-auto > [data-test="prerequisites-badge"]'
    ).should("have.text", "1 Prerequisite");
    cy.get('[data-course-id="3"] > .mt-auto').should(
      "have.text",
      "2 Prerequisites In Progress"
    );

    // Delete a course
    cy.get('[data-test="delete-course-btn-2"] > .lucide-icon').click();
    cy.get('[data-test="confirm-delete-btn"]').click();
    cy.get(
      '[data-test="prerequisites-section"] > [data-test="prerequisites-list"]'
    ).should("have.text", "PSY121");
  });

  it("Test editing courses", function () {
    // Register a new user
    cy.visit("/register");
    cy.get('[data-test="username-input"]').clear();
    cy.get('[data-test="username-input"]').type(testUser.username);
    cy.get('[data-test="password-input"]').clear();
    cy.get('[data-test="password-input"]').type(testUser.password);
    cy.get('[data-test="confirm-password-input"]').clear();
    cy.get('[data-test="confirm-password-input"]').type(testUser.password);
    cy.get('[data-test="register-submit-btn"]').click();

    // Add courses
    cy.get(
      '[data-test="nav-link-my-courses"] > .ring-offset-background'
    ).click();
    cy.get('[data-test="course-name-input"]').type("PSY121");
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="course-name-input"]').clear();
    cy.get('[data-test="course-name-input"]').type("PSY213");
    cy.get(
      ':nth-child(1) > [data-test="prerequisite-checkbox"] > .flex'
    ).click();
    cy.get('[data-test="course-credits-input"]').click();
    cy.get('[data-test="add-course-btn"]').click();
    cy.get('[data-test="course-name-input"]').clear();
    cy.get('[data-test="course-name-input"]').type("PSY214");
    cy.get(
      ':nth-child(1) > [data-test="prerequisite-checkbox"] > .flex'
    ).click();
    cy.get(
      ':nth-child(2) > [data-test="prerequisite-checkbox"] > .flex'
    ).click();
    cy.get('[data-test="add-course-btn"]').click();

    // Edit course
    cy.get('[data-test="edit-course-btn-3"] > .lucide-icon').click();
    cy.get('[data-test="edit-course-name-input"]').clear("PSY21");
    cy.get('[data-test="edit-course-name-input"]').type("PSY215");
    cy.get('[data-test="edit-course-credits-input"]').clear("6");
    cy.get('[data-test="edit-course-credits-input"]').type("6");
    cy.get('[data-test="save-edit-btn"]').click();
    cy.get(
      '[data-course-id="1"] > :nth-child(2) > .space-y-4 > .justify-between > .gap-2 > [data-test="complete-checkbox"] > .flex'
    ).click();
    cy.get(
      '[data-course-id="3"] > :nth-child(2) > .space-y-4 > .justify-between > .gap-2 > [data-test="complete-checkbox"] > .flex'
    ).click();
    cy.get(
      '[data-course-id="3"] > .flex-col > .justify-between > .flex-1 > .tracking-tight > [data-test="course-name"]'
    ).should("have.text", "PSY215");
    cy.get('[data-test="credits-completion"] > :nth-child(2)').should(
      "have.text",
      "9 / 12"
    );
    cy.get('[data-test="courses-completion"] > :nth-child(2)').should(
      "have.text",
      "2 / 3"
    );
    cy.get(
      '[data-course-id="2"] > :nth-child(2) > .space-y-4 > .justify-between > .gap-2 > [data-test="complete-checkbox"]'
    ).click();
    cy.get('[data-test="credits-completion"] > :nth-child(2)').should(
      "have.text",
      "12 / 12"
    );
  });
});
