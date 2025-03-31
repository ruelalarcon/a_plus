import { clearAllTables, closeDatabase } from "./server/db.js";
import dotenv from "dotenv";
import { resolve } from "path";

// Load test environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.test") });

// Set test environment
process.env.NODE_ENV = "test";
process.env.PORT = 3001; // Use a different port for testing

// Clear all data before each test
beforeEach(async () => {
  clearAllTables();
});

// Close database connection after all tests
afterAll(async () => {
  await closeDatabase();
});
