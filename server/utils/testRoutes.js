/**
 * Test-only routes for the application
 * These routes are only available when NODE_ENV is set to 'test'
 */

import express from "express";
import { clearAllTables } from "../db.js";
import { createLogger } from "./logger.js";
import { seedDatabase } from "./seedData.js";

const router = express.Router();
const testLogger = createLogger("test-routes");

/**
 * GET /reset
 * Resets the database by clearing all tables
 * This is useful for ensuring a clean state at the start of test suites
 * Can be called directly in browser: http://localhost:3000/reset
 *
 * @returns {Object} JSON response
 * @returns {string} response.message Success message
 * @returns {string} response.error Error message if failed
 */
router.get("/reset", (req, res) => {
  try {
    clearAllTables();
    testLogger.info("Database reset successful in test environment");
    res.status(200).json({ message: "Database reset successful" });
  } catch (error) {
    testLogger.error(`Failed to reset database: ${error.message}`, { error });
    res.status(500).json({ error: "Failed to reset database" });
  }
});

/**
 * GET /seed
 * Resets the database and seeds it with test data
 * Creates users, calculators, templates, courses, and their relationships
 * Can be called directly in browser: http://localhost:3000/seed
 *
 * @returns {Object} JSON response
 * @returns {Object} response.summary Summary of created records
 * @returns {string} response.message Success message
 * @returns {string} response.error Error message if failed
 */
router.get("/seed", async (req, res) => {
  try {
    // First clear all tables
    clearAllTables();
    testLogger.info("Database cleared before seeding");

    // Then seed with test data
    const summary = await seedDatabase();
    testLogger.info("Database seeded successfully", { summary });

    res.status(200).json({
      message: "Database seeded successfully",
      summary,
    });
  } catch (error) {
    testLogger.error(`Failed to seed database: ${error.message}`, { error });
    res.status(500).json({ error: "Failed to seed database" });
  }
});

export default router;
