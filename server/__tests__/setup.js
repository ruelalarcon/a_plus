import { clearAllTables, closeDatabase } from "../db.js";
import { app, startServer } from "../server.js";

// Set test environment
process.env.NODE_ENV = "test";
process.env.PORT = 3001; // Use a different port for testing
process.env.SESSION_SECRET = "test-secret-key"; // Add test session secret

let configuredApp;

// Configure app for testing - start the server before all tests
beforeAll(async () => {
  // Set a longer timeout for server startup if possible
  try {
    // Only use Jest's setTimeout if we're in a Jest environment
    if (typeof jest !== "undefined") {
      jest.setTimeout(10000);
    }
  } catch (error) {
    console.log("Not running in Jest environment, skipping timeout config");
  }

  try {
    // Start the server and get the configured app
    configuredApp = await startServer();
    console.log("Server started successfully for tests");
    expect(configuredApp).toBeDefined();
  } catch (error) {
    console.error("Failed to start server for tests:", error);
    throw error;
  }
});

// Clear all data before each test
beforeEach(async () => {
  try {
    clearAllTables();
  } catch (error) {
    console.error("Error clearing tables:", error);
    throw error;
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    await closeDatabase();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database:", error);
  }
});

// Add a dummy test to satisfy Jest
test("setup file initializes test environment", () => {
  expect(process.env.NODE_ENV).toBe("test");
  expect(configuredApp).toBeDefined();
});
