import { clearAllTables, closeDatabase } from "./server/db.js";

// Clear all data before each test
beforeEach(async () => {
  try {
    clearAllTables();
  } catch (error) {
    console.error("Error clearing all tables:", error);
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    await closeDatabase();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
});
