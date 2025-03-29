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
 * Helper function to create a test course using GraphQL
 */
async function createCourse(cookies, data = { name: "Test Course" }) {
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
            prerequisites {
              id
              name
            }
          }
        }
      `,
      variables: data,
    });

  if (!response.body.data?.createCourse) {
    console.error("Failed to create course:", response.body);
    throw new Error("Failed to create course");
  }

  return response.body.data.createCourse;
}

describe("Courses API", () => {
  let authCookies;

  beforeEach(async () => {
    // Clear database and create a unique test user
    clearAllTables();
    // Create a user and get auth cookies before each test
    authCookies = await createAuthenticatedUser("courseuser_" + Date.now());
  });

  describe("GraphQL myCourses query", () => {
    it("should return empty array when no courses exist", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query {
              myCourses {
                id
                name
                completed
                prerequisites {
                  id
                  name
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.myCourses)).toBe(true);
      expect(response.body.data.myCourses.length).toBe(0);
    });

    it("should return courses for authenticated user", async () => {
      // Create a course first
      await createCourse(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query {
              myCourses {
                id
                name
                completed
                prerequisites {
                  id
                  name
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.myCourses)).toBe(true);
      expect(response.body.data.myCourses.length).toBe(1);
      expect(response.body.data.myCourses[0]).toHaveProperty(
        "name",
        "Test Course"
      );
      expect(response.body.data.myCourses[0]).toHaveProperty("prerequisites");
    });

    it("should require authentication", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query {
            myCourses {
              id
              name
            }
          }
        `,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain("Not authenticated");
    });
  });

  describe("GraphQL createCourse mutation", () => {
    it("should create a new course", async () => {
      const courseData = {
        name: "New Course",
      };

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation CreateCourse($name: String!) {
              createCourse(name: $name) {
                id
                name
                completed
                prerequisites {
                  id
                  name
                }
              }
            }
          `,
          variables: courseData,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createCourse).toHaveProperty("id");
      expect(response.body.data.createCourse).toHaveProperty(
        "name",
        courseData.name
      );
      expect(response.body.data.createCourse).toHaveProperty("prerequisites");
      expect(response.body.data.createCourse.prerequisites).toEqual([]);
    });

    it("should create a course with prerequisites", async () => {
      // Create prerequisites first
      const prereq1 = await createCourse(authCookies, {
        name: "Prerequisite 1",
      });
      const prereq2 = await createCourse(authCookies, {
        name: "Prerequisite 2",
      });

      const courseData = {
        name: "Advanced Course",
        prerequisiteIds: [prereq1.id, prereq2.id],
      };

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation CreateCourse($name: String!, $prerequisiteIds: [ID!]) {
              createCourse(name: $name, prerequisiteIds: $prerequisiteIds) {
                id
                name
                prerequisites {
                  id
                  name
                }
              }
            }
          `,
          variables: courseData,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createCourse).toHaveProperty("id");
      expect(response.body.data.createCourse).toHaveProperty("prerequisites");
      expect(response.body.data.createCourse.prerequisites.length).toBe(2);
    });
  });

  describe("GraphQL updateCourse mutation", () => {
    let course;

    beforeEach(async () => {
      // Create a course to update
      course = await createCourse(authCookies);
    });

    it("should update course name", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCourse($id: ID!, $name: String) {
              updateCourse(id: $id, name: $name) {
                id
                name
              }
            }
          `,
          variables: {
            id: course.id,
            name: "Updated Course",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateCourse).toHaveProperty(
        "name",
        "Updated Course"
      );
    });

    it("should mark course as completed", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCourse($id: ID!, $completed: Boolean) {
              updateCourse(id: $id, completed: $completed) {
                id
                name
                completed
              }
            }
          `,
          variables: {
            id: course.id,
            completed: true,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateCourse).toHaveProperty("completed", true);
    });

    it("should update course prerequisites", async () => {
      // Create a prerequisite
      const prereq = await createCourse(authCookies, {
        name: "Prerequisite Course",
      });

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCourse($id: ID!, $prerequisiteIds: [ID!]) {
              updateCourse(id: $id, prerequisiteIds: $prerequisiteIds) {
                id
                name
                prerequisites {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            id: course.id,
            prerequisiteIds: [prereq.id],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateCourse).toHaveProperty("prerequisites");
      expect(response.body.data.updateCourse.prerequisites.length).toBe(1);
      expect(response.body.data.updateCourse.prerequisites[0].name).toBe(
        "Prerequisite Course"
      );
    });
  });

  describe("GraphQL deleteCourse mutation", () => {
    it("should delete a course", async () => {
      // Create a course to delete
      const course = await createCourse(authCookies);

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation DeleteCourse($id: ID!) {
              deleteCourse(id: $id)
            }
          `,
          variables: { id: course.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deleteCourse).toBe(true);

      // Verify course is deleted
      const getResponse = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query {
              myCourses {
                id
                name
              }
            }
          `,
        });

      expect(getResponse.body.data.myCourses.length).toBe(0);
    });

    it("should delete prerequisites when course is deleted", async () => {
      // Create two courses
      const course1 = await createCourse(authCookies, { name: "Course 1" });
      const course2 = await createCourse(authCookies, { name: "Course 2" });

      // Make course2 depend on course1
      await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation UpdateCourse($id: ID!, $prerequisiteIds: [ID!]) {
              updateCourse(id: $id, prerequisiteIds: $prerequisiteIds) {
                id
              }
            }
          `,
          variables: {
            id: course2.id,
            prerequisiteIds: [course1.id],
          },
        });

      // Delete course1
      await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation DeleteCourse($id: ID!) {
              deleteCourse(id: $id)
            }
          `,
          variables: { id: course1.id },
        });

      // Get course2 and verify it no longer has prerequisites
      const getResponse = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            query {
              myCourses {
                id
                name
                prerequisites {
                  id
                  name
                }
              }
            }
          `,
        });

      // Only course2 should remain
      expect(getResponse.body.data.myCourses.length).toBe(1);
      expect(getResponse.body.data.myCourses[0].prerequisites.length).toBe(0);
    });
  });
});
