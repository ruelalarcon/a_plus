import { closeDatabase } from "./server/db.js";

// Close database connection after all tests
afterAll(async () => {
  try {
    await closeDatabase();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
});
