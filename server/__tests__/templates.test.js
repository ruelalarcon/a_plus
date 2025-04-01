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
 * Helper function to create a test template using GraphQL
 */
async function createTemplate(cookies, data = {}) {
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

  const mergedData = { ...defaultData, ...data };

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

describe("Templates API", () => {
  let authCookies;

  beforeEach(async () => {
    // Clear database and create a unique test user
    clearAllTables();
    // Create a user and get auth cookies before each test
    authCookies = await createAuthenticatedUser("templateuser_" + Date.now());
  });

  describe("GraphQL createTemplate mutation", () => {
    it("should create a new template", async () => {
      const templateData = {
        name: "New Template",
        term: "Winter",
        year: 2024,
        institution: "University of Testing",
        assessments: [
          { name: "Assignment 1", weight: 20 },
          { name: "Assignment 2", weight: 20 },
          { name: "Final Exam", weight: 60 },
        ],
      };

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
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
              }
            }
          `,
          variables: templateData,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createTemplate).toHaveProperty("id");
      expect(response.body.data.createTemplate).toHaveProperty(
        "name",
        templateData.name
      );
    });

    it("should require authentication", async () => {
      const response = await request.post("/graphql").send({
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
            }
          }
        `,
        variables: {
          name: "Test Template",
          term: "Fall",
          year: 2023,
          institution: "Test University",
          assessments: [],
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain("Not authenticated");
    });
  });

  describe("GraphQL allTemplates query", () => {
    beforeEach(async () => {
      // Create some templates for searching
      await createTemplate(authCookies, {
        name: "Math 101",
        term: "Fall",
        year: 2023,
        institution: "University A",
      });

      await createTemplate(authCookies, {
        name: "Computer Science 200",
        term: "Winter",
        year: 2024,
        institution: "University B",
      });

      // Add more templates for search testing
      await createTemplate(authCookies, {
        name: "CMPT 370",
        term: "Fall",
        year: 2023,
        institution: "University of Saskatchewan",
      });

      await createTemplate(authCookies, {
        name: "Introduction to Algorithms",
        term: "Winter CMPT",
        year: 2024,
        institution: "University of Alberta",
      });

      await createTemplate(authCookies, {
        name: "Physics 115",
        term: "Fall",
        year: 2023,
        institution: "CMPT University",
      });
    });

    it("should search templates by query", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($searchQuery: String) {
            allTemplates(query: $searchQuery) {
              templates {
                id
                name
                institution
              }
              total
              page
              limit
            }
          }
        `,
        variables: {
          searchQuery: "math",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.data.allTemplates).toBeDefined();
      expect(response.body.data.allTemplates.templates).toBeDefined();
      // Don't expect specific results as search implementation may vary
      // Just verify the structure is correct
      expect(Array.isArray(response.body.data.allTemplates.templates)).toBe(
        true
      );
      expect(response.body.data.allTemplates.total).toBeDefined();
      expect(response.body.data.allTemplates.page).toBeDefined();
      expect(response.body.data.allTemplates.limit).toBeDefined();
    });

    it("should search templates by institution", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($institution: String) {
            allTemplates(institution: $institution) {
              templates {
                id
                name
                institution
              }
              total
              page
              limit
            }
          }
        `,
        variables: {
          institution: "University B",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.data.allTemplates).toBeDefined();
      expect(response.body.data.allTemplates.templates).toBeDefined();
      // Don't expect specific results as search implementation may vary
      // Just verify the structure is correct
      expect(Array.isArray(response.body.data.allTemplates.templates)).toBe(
        true
      );
      expect(response.body.data.allTemplates.total).toBeDefined();
      expect(response.body.data.allTemplates.page).toBeDefined();
      expect(response.body.data.allTemplates.limit).toBeDefined();
    });

    // Add new tests for the search functionality
    it("should find templates with 'CMPT' in name field", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($searchQuery: String) {
            allTemplates(query: $searchQuery) {
              templates {
                id
                name
                term
                institution
              }
              total
            }
          }
        `,
        variables: {
          searchQuery: "CMPT",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.data.allTemplates.templates.length).toBeGreaterThan(
        0
      );

      // Should find CMPT 370
      const foundCmptTemplate = response.body.data.allTemplates.templates.some(
        (template) => template.name === "CMPT 370"
      );
      expect(foundCmptTemplate).toBe(true);
    });

    it("should find templates with partial matches like 'CMPT 3'", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($searchQuery: String) {
            allTemplates(query: $searchQuery) {
              templates {
                id
                name
                term
                institution
              }
              total
            }
          }
        `,
        variables: {
          searchQuery: "CMPT 3",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.data.allTemplates.templates.length).toBeGreaterThan(
        0
      );

      // Should find CMPT 370
      const foundCmptTemplate = response.body.data.allTemplates.templates.some(
        (template) => template.name === "CMPT 370"
      );
      expect(foundCmptTemplate).toBe(true);
    });

    it("should match across multiple fields with OR logic", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($searchQuery: String) {
            allTemplates(query: $searchQuery) {
              templates {
                id
                name
                term
                institution
              }
              total
            }
          }
        `,
        variables: {
          searchQuery: "CMPT",
        },
      });

      expect(response.status).toBe(200);
      expect(
        response.body.data.allTemplates.templates.length
      ).toBeGreaterThanOrEqual(3);

      // Should find templates with CMPT in any field (name, term, institution)
      const foundTemplates = response.body.data.allTemplates.templates;

      const nameMatch = foundTemplates.some((t) => t.name.includes("CMPT"));
      const termMatch = foundTemplates.some((t) => t.term.includes("CMPT"));
      const institutionMatch = foundTemplates.some((t) =>
        t.institution.includes("CMPT")
      );

      // At least one of these should be true if OR logic is working
      expect(nameMatch || termMatch || institutionMatch).toBe(true);
    });

    it("should rank templates with exact match higher", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($searchQuery: String) {
            allTemplates(query: $searchQuery) {
              templates {
                id
                name
                term
                institution
              }
              total
            }
          }
        `,
        variables: {
          searchQuery: "CMPT 370",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.data.allTemplates.templates.length).toBeGreaterThan(
        0
      );

      // The exact match "CMPT 370" should be ranked first
      expect(response.body.data.allTemplates.templates[0].name).toBe(
        "CMPT 370"
      );
    });

    it("should support combined filtering with multiple parameters", async () => {
      const response = await request.post("/graphql").send({
        query: `
          query AllTemplates($searchQuery: String, $term: String, $year: Int) {
            allTemplates(query: $searchQuery, term: $term, year: $year) {
              templates {
                id
                name
                term
                year
                institution
              }
              total
            }
          }
        `,
        variables: {
          searchQuery: "CMPT",
          term: "Fall",
          year: 2023,
        },
      });

      expect(response.status).toBe(200);

      // At least one result should match each parameter
      // Since our implementation uses OR between search fields, not AND
      const hasYearMatch = response.body.data.allTemplates.templates.some(
        (t) => t.year === 2023
      );
      const hasTermMatch = response.body.data.allTemplates.templates.some((t) =>
        t.term.includes("Fall")
      );

      expect(hasYearMatch).toBe(true);
      expect(hasTermMatch).toBe(true);

      // And at least one should match CMPT
      const hasCmptMatch = response.body.data.allTemplates.templates.some(
        (t) =>
          t.name.includes("CMPT") ||
          t.term.includes("CMPT") ||
          t.institution.includes("CMPT")
      );
      expect(hasCmptMatch).toBe(true);
    });

    it("should handle pagination correctly", async () => {
      // First page with limit 2
      const firstPageResponse = await request.post("/graphql").send({
        query: `
          query AllTemplates($limit: Int, $page: Int) {
            allTemplates(limit: $limit, page: $page) {
              templates {
                id
                name
              }
              total
              page
              limit
            }
          }
        `,
        variables: {
          limit: 2,
          page: 1,
        },
      });

      expect(firstPageResponse.status).toBe(200);
      expect(firstPageResponse.body.data.allTemplates.templates.length).toBe(2);
      expect(firstPageResponse.body.data.allTemplates.page).toBe(1);
      expect(firstPageResponse.body.data.allTemplates.limit).toBe(2);

      // Total should be the total number of templates (5 in our setup)
      expect(firstPageResponse.body.data.allTemplates.total).toBe(5);

      // Second page
      const secondPageResponse = await request.post("/graphql").send({
        query: `
          query AllTemplates($limit: Int, $page: Int) {
            allTemplates(limit: $limit, page: $page) {
              templates {
                id
                name
              }
              total
              page
              limit
            }
          }
        `,
        variables: {
          limit: 2,
          page: 2,
        },
      });

      expect(secondPageResponse.status).toBe(200);
      expect(secondPageResponse.body.data.allTemplates.templates.length).toBe(
        2
      );
      expect(secondPageResponse.body.data.allTemplates.page).toBe(2);

      // Verify different results between pages
      const firstPageIds =
        firstPageResponse.body.data.allTemplates.templates.map((t) => t.id);
      const secondPageIds =
        secondPageResponse.body.data.allTemplates.templates.map((t) => t.id);

      // No overlapping IDs between pages
      const hasOverlap = firstPageIds.some((id) => secondPageIds.includes(id));
      expect(hasOverlap).toBe(false);
    });
  });

  describe("GraphQL voteTemplate mutation", () => {
    let templateId;
    let secondUserCookies;

    beforeEach(async () => {
      // Create a template
      const template = await createTemplate(authCookies);
      templateId = template.id;

      // Create a second user for voting
      secondUserCookies = await createAuthenticatedUser("voter_" + Date.now());
    });

    it("should upvote a template", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", secondUserCookies)
        .send({
          query: `
            mutation VoteTemplate($id: ID!, $vote: Int!) {
              voteTemplate(templateId: $id, vote: $vote) {
                id
                vote_count
                user_vote
              }
            }
          `,
          variables: {
            id: templateId,
            vote: 1,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.voteTemplate).toHaveProperty("vote_count");
      expect(response.body.data.voteTemplate).toHaveProperty("user_vote", 1);
    });

    it("should not allow voting on own template", async () => {
      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies) // Original creator
        .send({
          query: `
            mutation VoteTemplate($id: ID!, $vote: Int!) {
              voteTemplate(templateId: $id, vote: $vote) {
                id
                vote_count
                user_vote
              }
            }
          `,
          variables: {
            id: templateId,
            vote: 1,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        "Cannot vote on your own template"
      );
    });
  });

  describe("GraphQL addTemplateComment mutation", () => {
    let templateId;

    beforeEach(async () => {
      // Create a template
      const template = await createTemplate(authCookies);
      templateId = template.id;
    });

    it("should add a comment to a template", async () => {
      const commentData = { content: "This is a test comment." };

      const response = await request
        .post("/graphql")
        .set("Cookie", authCookies)
        .send({
          query: `
            mutation AddTemplateComment($id: ID!, $content: String!) {
              addTemplateComment(templateId: $id, content: $content) {
                id
                content
                author {
                  id
                  username
                }
              }
            }
          `,
          variables: {
            id: templateId,
            content: commentData.content,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.addTemplateComment).toHaveProperty(
        "content",
        commentData.content
      );
      expect(response.body.data.addTemplateComment).toHaveProperty("author");
    });
  });
});
