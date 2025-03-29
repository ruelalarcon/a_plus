import supertest from "supertest";
import { app, startServer } from "../server.js";
import { createAuthenticatedUser } from "./test-helpers.js";
import { clearAllTables } from "../db.js";

// Initialize request after server starts
let request;

beforeAll(async () => {
  // Make sure the server is started before tests
  await startServer();
  request = supertest(app);
});

/**
 * Helper function to create a test calculator using GraphQL
 */
async function createCalculator(cookies, data = { name: "Test Calculator" }) {
  const response = await request
    .post("/graphql")
    .set("Cookie", cookies)
    .send({
      query: `
        mutation CreateCalculator($name: String!, $minDesiredGrade: Float) {
          createCalculator(name: $name, min_desired_grade: $minDesiredGrade) {
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
      `,
      variables: {
        name: data.name,
        minDesiredGrade: data.min_desired_grade,
      },
    });

  if (!response.body.data?.createCalculator) {
    console.error("Failed to create calculator:", response.body);
    throw new Error("Failed to create calculator");
  }

  return response.body.data.createCalculator;
}

describe("Calculators API", () => {
  let authCookies;

  beforeEach(async () => {
    // Clear database and create a unique test user
    clearAllTables();
    // Create a user and get auth cookies before each test
    authCookies = await createAuthenticatedUser("calcuser_" + Date.now());
  });

  describe("GraphQL calculator query", () => {
    it("should return a calculator by ID", async () => {
      // Create a calculator first
      const calculator = await createCalculator(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query GetCalculator($id: ID!) {
              calculator(id: $id) {
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
          `,
          variables: { id: calculator.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.calculator).toHaveProperty("id", calculator.id);
      expect(response.body.data.calculator).toHaveProperty(
        "name",
        calculator.name
      );
    });

    it("should return null when calculator doesn't exist", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query GetCalculator($id: ID!) {
              calculator(id: $id) {
                id
                name
              }
            }
          `,
          variables: { id: 999 },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.calculator).toBeNull();
    });

    it("should throw error when trying to access another user's calculator", async () => {
      // Create a calculator with the first user
      const calculator = await createCalculator(authCookies);

      // Create a second user
      const secondUserCookies = await createAuthenticatedUser(
        "calcuser2_" + Date.now()
      );

      // Try to access the calculator with the second user
      const response = await request
        .post("/graphql")
        .set("Cookie", secondUserCookies)
        .send({
          query: `
            query GetCalculator($id: ID!) {
              calculator(id: $id) {
                id
                name
              }
            }
          `,
          variables: { id: calculator.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain("Not authorized");
    });
  });

  describe("GraphQL createCalculator mutation", () => {
    it("should create a new calculator", async () => {
      const calculatorData = {
        name: "New Calculator",
        minDesiredGrade: 85.5,
      };

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation CreateCalculator($name: String!, $minDesiredGrade: Float) {
              createCalculator(
                name: $name
                min_desired_grade: $minDesiredGrade
              ) {
                id
                name
                min_desired_grade
              }
            }
          `,
          variables: calculatorData,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createCalculator).toHaveProperty("id");
      expect(response.body.data.createCalculator).toHaveProperty(
        "name",
        calculatorData.name
      );
      expect(response.body.data.createCalculator).toHaveProperty(
        "min_desired_grade",
        calculatorData.minDesiredGrade
      );
    });
  });

  describe("GraphQL updateCalculator mutation", () => {
    let calculator;

    beforeEach(async () => {
      // Create a calculator to update
      calculator = await createCalculator(authCookies);
    });

    it("should update calculator name", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCalculator($id: ID!, $name: String) {
              updateCalculator(id: $id, name: $name) {
                id
                name
              }
            }
          `,
          variables: {
            id: calculator.id,
            name: "Updated Calculator",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateCalculator).toHaveProperty(
        "name",
        "Updated Calculator"
      );

      // Verify the update
      const getResponse = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query Calculator($id: ID!) {
              calculator(id: $id) {
                name
              }
            }
          `,
          variables: {
            id: calculator.id,
          },
        });

      expect(getResponse.body.data.calculator).toHaveProperty(
        "name",
        "Updated Calculator"
      );
    });

    it("should update calculator assessments", async () => {
      const assessments = [
        { name: "Midterm", weight: 40, grade: 92 },
        { name: "Final", weight: 60, grade: 88 },
      ];

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCalculator(
              $id: ID!
              $assessments: [AssessmentInput!]
            ) {
              updateCalculator(id: $id, assessments: $assessments) {
                id
                assessments {
                  name
                  weight
                  grade
                }
              }
            }
          `,
          variables: {
            id: calculator.id,
            assessments,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateCalculator.assessments.length).toBe(2);
      expect(response.body.data.updateCalculator.assessments[0]).toHaveProperty(
        "name",
        "Midterm"
      );
      expect(response.body.data.updateCalculator.assessments[0]).toHaveProperty(
        "grade",
        92
      );
    });

    it("should update both min_desired_grade and assessments in a single request", async () => {
      const updateData = {
        id: calculator.id,
        minDesiredGrade: 85,
        assessments: [
          { name: "Quiz", weight: 20, grade: 90 },
          { name: "Midterm", weight: 30, grade: 88 },
          { name: "Final", weight: 50, grade: null },
        ],
      };

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCalculator(
              $id: ID!
              $minDesiredGrade: Float
              $assessments: [AssessmentInput!]
            ) {
              updateCalculator(
                id: $id
                min_desired_grade: $minDesiredGrade
                assessments: $assessments
              ) {
                id
                name
                min_desired_grade
                assessments {
                  name
                  weight
                  grade
                }
              }
            }
          `,
          variables: updateData,
        });

      expect(response.status).toBe(200);

      // Verify min_desired_grade was updated
      expect(response.body.data.updateCalculator).toHaveProperty(
        "min_desired_grade",
        updateData.minDesiredGrade
      );

      // Verify assessments were updated
      expect(response.body.data.updateCalculator.assessments.length).toBe(3);
      expect(response.body.data.updateCalculator.assessments[0]).toHaveProperty(
        "name",
        "Quiz"
      );
      expect(response.body.data.updateCalculator.assessments[0]).toHaveProperty(
        "grade",
        90
      );
      expect(response.body.data.updateCalculator.assessments[1]).toHaveProperty(
        "name",
        "Midterm"
      );
      expect(response.body.data.updateCalculator.assessments[2]).toHaveProperty(
        "name",
        "Final"
      );
      expect(response.body.data.updateCalculator.assessments[2]).toHaveProperty(
        "grade",
        null
      );
    });
  });

  describe("GraphQL deleteCalculator mutation", () => {
    it("should delete a calculator", async () => {
      // Create a calculator to delete
      const calculator = await createCalculator(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation DeleteCalculator($id: ID!) {
              deleteCalculator(id: $id)
            }
          `,
          variables: { id: calculator.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deleteCalculator).toBe(true);

      // Verify deletion
      const getResponse = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query Calculator($id: ID!) {
              calculator(id: $id) {
                id
              }
            }
          `,
          variables: { id: calculator.id },
        });

      expect(getResponse.body.data.calculator).toBeNull();
    });
  });
});
