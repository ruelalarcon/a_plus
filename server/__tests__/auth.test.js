import supertest from "supertest";
import { app, startServer } from "../server.js";
import { clearAllTables } from "../db.js";

// Set environment to test
process.env.NODE_ENV = "test";

// Make sure startServer is called before making any requests
let request;

beforeAll(async () => {
  // Make sure the server is started (will be a no-op if already started)
  await startServer();
  request = supertest(app);
});

describe("Authentication API", () => {
  const testUser = {
    username: "testuser",
    password: "password123",
  };

  beforeEach(async () => {
    // Clear database before each test
    clearAllTables();
  });

  describe("GraphQL register mutation", () => {
    it("should register a new user", async () => {
      const response = await request.post("/graphql").send({
        query: `
          mutation Register($username: String!, $password: String!) {
            register(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.register).toHaveProperty("id");
      expect(response.body.data.register).toHaveProperty(
        "username",
        testUser.username
      );
    });

    it("should return error if username already exists", async () => {
      // First registration
      await request.post("/graphql").send({
        query: `
          mutation Register($username: String!, $password: String!) {
            register(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      // Second registration with same username
      const response = await request.post("/graphql").send({
        query: `
          mutation Register($username: String!, $password: String!) {
            register(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        "Username already exists"
      );
    });
  });

  describe("GraphQL login mutation", () => {
    beforeEach(async () => {
      // Register user before testing login
      await request.post("/graphql").send({
        query: `
          mutation Register($username: String!, $password: String!) {
            register(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });
    });

    it("should login with correct credentials", async () => {
      const response = await request.post("/graphql").send({
        query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.login).toHaveProperty("id");
      expect(response.body.data.login).toHaveProperty(
        "username",
        testUser.username
      );
      // Verify we get cookies back
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"].length).toBeGreaterThan(0);
    });

    it("should reject invalid credentials", async () => {
      const response = await request.post("/graphql").send({
        query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: {
          username: testUser.username,
          password: "wrongpassword",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain("Invalid credentials");
    });
  });

  describe("GraphQL me query", () => {
    let authCookies;

    beforeEach(async () => {
      // Register and login
      await request.post("/graphql").send({
        query: `
          mutation Register($username: String!, $password: String!) {
            register(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      const loginResponse = await request.post("/graphql").send({
        query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      authCookies = loginResponse.headers["set-cookie"];
      expect(authCookies).toBeDefined();
      expect(authCookies.length).toBeGreaterThan(0);
    });

    it("should return user info when logged in", async () => {
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

      expect(response.status).toBe(200);
      expect(response.body.data.me).toHaveProperty(
        "username",
        testUser.username
      );
      expect(response.body.data.me).toHaveProperty("id");
    });

    it("should return null when not logged in", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query {
            me {
              id
              username
            }
          }
        `,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.me).toBeNull();
    });
  });

  describe("GraphQL logout mutation", () => {
    let authCookies;

    beforeEach(async () => {
      // Register and login
      await request.post("/graphql").send({
        query: `
          mutation Register($username: String!, $password: String!) {
            register(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      const loginResponse = await request.post("/graphql").send({
        query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              id
              username
            }
          }
        `,
        variables: testUser,
      });

      authCookies = loginResponse.headers["set-cookie"];
      expect(authCookies).toBeDefined();
      expect(authCookies.length).toBeGreaterThan(0);
    });

    it("should successfully log out", async () => {
      // First verify we're logged in
      const meResponse = await request
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

      expect(meResponse.body.data.me).not.toBeNull();

      // Now logout
      const logoutResponse = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation {
              logout
            }
          `,
        });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.data.logout).toBe(true);

      // Verify we're logged out by using the same cookie
      const afterLogoutResponse = await request
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

      expect(afterLogoutResponse.body.data.me).toBeNull();
    });
  });
});
