import supertest from "supertest";
import { app, startServer } from "../server.js";

// Make sure the server is started before creating supertest object
let requestPromise = (async () => {
  // Wait for server to start before creating supertest instance
  await startServer();
  return supertest(app);
})();

/**
 * Creates a test user and returns the authentication cookie
 * @param {string} username - Username for the test user
 * @returns {Promise<string[]>} - Cookie headers for authenticated requests
 */
export async function createAuthenticatedUser(username = "testuser") {
  // Get the request object that waits for server to be started
  const request = await requestPromise;

  const userCredentials = {
    username,
    password: "password123",
  };

  try {
    // Register user using GraphQL - ignore if already exists
    const registerResponse = await request.post("/graphql").send({
      query: `
        mutation Register($username: String!, $password: String!) {
          register(username: $username, password: $password) {
            id
            username
          }
        }
      `,
      variables: userCredentials,
    });

    if (
      registerResponse.status !== 200 &&
      !registerResponse.body.errors?.some((e) =>
        e.message.includes("already exists")
      )
    ) {
      console.warn("Registration failed:", registerResponse.body);
    }
  } catch (error) {
    console.warn("Error during registration:", error.message);
    // Continue despite errors - user might already exist
  }

  // Login user using GraphQL
  try {
    const loginResponse = await request.post("/graphql").send({
      query: `
        mutation Login($username: String!, $password: String!) {
          login(username: $username, password: $password) {
            id
            username
          }
        }
      `,
      variables: userCredentials,
    });

    if (!loginResponse.headers["set-cookie"]) {
      console.error("Login failed - no cookies returned:", loginResponse.body);
      throw new Error("Login failed - authentication cookies not set");
    }

    // Return the cookies for authenticated requests
    return loginResponse.headers["set-cookie"];
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

/**
 * Creates a test calculator
 * @param {string[]} cookies - Authentication cookies
 * @param {object} calculatorData - Calculator data
 * @returns {Promise<object>} - Created calculator
 */
export async function createTestCalculator(
  cookies,
  calculatorData = { name: "Test Calculator" }
) {
  if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Invalid authentication cookies provided");
  }

  // Get the request object that waits for server to be started
  const request = await requestPromise;

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
            user {
              id
              username
            }
          }
        }
      `,
      variables: {
        name: calculatorData.name,
        minDesiredGrade: calculatorData.min_desired_grade,
      },
    });

  if (!response.body.data?.createCalculator) {
    console.error("Failed to create calculator:", response.body);
    throw new Error("Failed to create calculator");
  }

  return response.body.data.createCalculator;
}

/**
 * Creates a test template
 * @param {string[]} cookies - Authentication cookies
 * @param {object} templateData - Template data
 * @returns {Promise<object>} - Created template
 */
export async function createTestTemplate(cookies, templateData = {}) {
  if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Invalid authentication cookies provided");
  }

  // Get the request object that waits for server to be started
  const request = await requestPromise;

  const defaultData = {
    name: "Test Template",
    term: "Fall",
    year: 2023,
    institution: "Test University",
    assessments: [
      { name: "Midterm", weight: 30 },
      { name: "Final", weight: 70 },
    ],
  };

  const mergedData = { ...defaultData, ...templateData };

  const response = await request
    .post("/graphql")
    .set("Cookie", cookies)
    .send({
      query: `
        mutation CreateTemplate(
          $name: String!
          $term: String!
          $year: Int!
          $institution: String!
          $assessments: [TemplateAssessmentInput!]!
        ) {
          createTemplate(
            name: $name
            term: $term
            year: $year
            institution: $institution
            assessments: $assessments
          ) {
            id
            name
            term
            year
            institution
            creator {
              id
              username
            }
          }
        }
      `,
      variables: mergedData,
    });

  if (!response.body.data?.createTemplate) {
    console.error("Failed to create template:", response.body);
    throw new Error("Failed to create template");
  }

  return response.body.data.createTemplate;
}

/**
 * Creates a test course
 * @param {string[]} cookies - Authentication cookies
 * @param {object} courseData - Course data
 * @returns {Promise<object>} - Created course
 */
export async function createTestCourse(
  cookies,
  courseData = { name: "Test Course" }
) {
  if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Invalid authentication cookies provided");
  }

  // Get the request object that waits for server to be started
  const request = await requestPromise;

  const response = await request
    .post("/graphql")
    .set("Cookie", cookies)
    .send({
      query: `
        mutation CreateCourse($name: String!, $prerequisiteIds: [ID!]) {
          createCourse(name: $name, prerequisiteIds: $prerequisiteIds) {
            id
            name
            completed
            user {
              id
              username
            }
            prerequisites {
              id
              name
            }
          }
        }
      `,
      variables: courseData,
    });

  if (!response.body.data?.createCourse) {
    console.error("Failed to create course:", response.body);
    throw new Error("Failed to create course");
  }

  return response.body.data.createCourse;
}

// Add a dummy test
describe("Test helpers", () => {
  test("should exist", () => {
    expect(typeof createAuthenticatedUser).toBe("function");
  });
});
