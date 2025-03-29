import supertest from "supertest";
import { app, startServer } from "../server.js";
import {
  createAuthenticatedUser,
  createTestCourse,
  createTestCalculator,
  createTestTemplate,
} from "./test-helpers.js";
import { clearAllTables } from "../db.js";

// Initialize request after server starts
let request;

beforeAll(async () => {
  // Make sure the server is started before tests
  await startServer();
  request = supertest(app);
});

describe("User API", () => {
  let authCookies;
  let userId;

  beforeEach(async () => {
    // Clear database and create a unique test user
    clearAllTables();
    // Create a user and get auth cookies before each test
    authCookies = await createAuthenticatedUser("usertest_" + Date.now());

    // Get the user ID
    const response = await request
      .post("/graphql")
      .set("Cookie", authCookies)
      .send({
        query: `
          query {
            me {
              id
              username
            }
          }
        `,
      });

    userId = response.body.data.me.id;
  });

  describe("GraphQL User.courses field resolver", () => {
    it("should return empty array when no courses exist", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserCourses($userId: ID!) {
              user(id: $userId) {
                id
                courses {
                  id
                  name
                  completed
                  prerequisites {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.courses)).toBe(true);
      expect(response.body.data.user.courses.length).toBe(0);
    });

    it("should return courses for authenticated user", async () => {
      // Create a course first
      await createTestCourse(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserCourses($userId: ID!) {
              user(id: $userId) {
                id
                courses {
                  id
                  name
                  completed
                  prerequisites {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.courses)).toBe(true);
      expect(response.body.data.user.courses.length).toBe(1);
      expect(response.body.data.user.courses[0]).toHaveProperty(
        "name",
        "Test Course"
      );
      expect(response.body.data.user.courses[0]).toHaveProperty(
        "prerequisites"
      );
    });

    it("should not allow viewing courses of other users", async () => {
      // Create a second user
      const secondUserCookies = await createAuthenticatedUser(
        "seconduser_" + Date.now()
      );
      let secondUserId;

      // Get the second user's ID
      const userResponse = await request
        .post("/graphql")
        .set("Cookie", secondUserCookies)
        .send({
          query: `
            query {
              me {
                id
                username
              }
            }
          `,
        });
      secondUserId = userResponse.body.data.me.id;

      // Add a course for the second user
      await createTestCourse(secondUserCookies);

      // Try to access the second user's courses from the first user
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserCourses($userId: ID!) {
              user(id: $userId) {
                id
                courses {
                  id
                  name
                }
              }
            }
          `,
          variables: { userId: secondUserId },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain("Not authorized");
    });
  });

  describe("GraphQL User.calculators field resolver", () => {
    it("should return empty array when no calculators exist", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserCalculators($userId: ID!) {
              user(id: $userId) {
                id
                calculators {
                  id
                  name
                  min_desired_grade
                  assessments {
                    id
                    name
                    weight
                    grade
                  }
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.calculators)).toBe(true);
      expect(response.body.data.user.calculators.length).toBe(0);
    });

    it("should return calculators for authenticated user", async () => {
      // Create a calculator first
      await createTestCalculator(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserCalculators($userId: ID!) {
              user(id: $userId) {
                id
                calculators {
                  id
                  name
                  min_desired_grade
                  assessments {
                    id
                    name
                    weight
                    grade
                  }
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.calculators)).toBe(true);
      expect(response.body.data.user.calculators.length).toBe(1);
      expect(response.body.data.user.calculators[0]).toHaveProperty(
        "name",
        "Test Calculator"
      );
    });

    it("should not allow viewing calculators of other users", async () => {
      // Create a second user
      const secondUserCookies = await createAuthenticatedUser(
        "seconduser_" + Date.now()
      );
      let secondUserId;

      // Get the second user's ID
      const userResponse = await request
        .post("/graphql")
        .set("Cookie", secondUserCookies)
        .send({
          query: `
            query {
              me {
                id
                username
              }
            }
          `,
        });
      secondUserId = userResponse.body.data.me.id;

      // Add a calculator for the second user
      await createTestCalculator(secondUserCookies);

      // Try to access the second user's calculators from the first user
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserCalculators($userId: ID!) {
              user(id: $userId) {
                id
                calculators {
                  id
                  name
                }
              }
            }
          `,
          variables: { userId: secondUserId },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain("Not authorized");
    });
  });

  describe("GraphQL User.templates field resolver", () => {
    it("should return empty array when no templates exist", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserTemplates($userId: ID!) {
              user(id: $userId) {
                id
                templates {
                  id
                  name
                  term
                  year
                  institution
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.templates)).toBe(true);
      expect(response.body.data.user.templates.length).toBe(0);
    });

    it("should return templates for a user", async () => {
      // Create a template first
      await createTestTemplate(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserTemplates($userId: ID!) {
              user(id: $userId) {
                id
                templates {
                  id
                  name
                  term
                  year
                  institution
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.templates)).toBe(true);
      expect(response.body.data.user.templates.length).toBe(1);
      expect(response.body.data.user.templates[0]).toHaveProperty(
        "name",
        "Test Template"
      );
    });

    it("should allow viewing another user's templates (public data)", async () => {
      // Create a template first
      await createTestTemplate(authCookies);

      // Create a second user
      const secondUserCookies = await createAuthenticatedUser(
        "seconduser_" + Date.now()
      );

      // Second user should be able to view first user's templates
      const response = await request
        .post("/graphql")
        .set("Cookie", secondUserCookies)
        .send({
          query: `
            query UserTemplates($userId: ID!) {
              user(id: $userId) {
                id
                templates {
                  id
                  name
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.user.templates)).toBe(true);
      expect(response.body.data.user.templates.length).toBe(1);
    });
  });

  describe("GraphQL userComments query", () => {
    beforeEach(async () => {
      // Create a template
      const template = await createTestTemplate(authCookies);

      // Add a comment to the template
      await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation AddComment($templateId: ID!, $content: String!) {
              addTemplateComment(templateId: $templateId, content: $content) {
                id
                content
              }
            }
          `,
          variables: {
            templateId: template.id,
            content: "Test comment",
          },
        });
    });

    it("should return a user's comments", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query UserComments($userId: ID!) {
              userComments(userId: $userId) {
                id
                content
                author {
                  id
                  username
                }
                template {
                  id
                  name
                }
              }
            }
          `,
          variables: { userId },
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.userComments)).toBe(true);
      expect(response.body.data.userComments.length).toBe(1);
      expect(response.body.data.userComments[0]).toHaveProperty(
        "content",
        "Test comment"
      );
    });
  });
});
