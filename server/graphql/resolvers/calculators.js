/**
 * Calculator-related GraphQL resolvers
 *
 * This file contains all the resolvers related to grade calculators, including
 * queries to fetch calculators, mutations to create/update/delete calculators,
 * and type resolvers for the Calculator type that handle related data like
 * assessments and the associated template if applicable.
 */

import db from "../../db.js";
import { GraphQLError } from "graphql";
import { createLogger } from "../../utils/logger.js";

// Create a context-specific logger
const logger = createLogger("calculator-resolver");

/**
 * Calculator-related GraphQL queries
 */
export const calculatorQueries = {
  /**
   * Retrieves a specific calculator by ID for the current user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the calculator to retrieve
   * @param {Object} context - Request context containing session data
   * @returns {Object} - Calculator object if found and belongs to user
   * @throws {GraphQLError} - If user is not authenticated or not authorized to view this calculator
   */
  calculator: (_parent, { id }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    logger.debug(
      `Fetching calculator with ID: ${id} for user: ${context.session.userId}`
    );

    // Fetch the calculator
    const calc = db.prepare("SELECT * FROM calculators WHERE id = ?").get(id);

    if (!calc) {
      logger.debug(`Calculator with ID: ${id} not found`);
      throw new GraphQLError("Calculator not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Check if user is authorized to view this calculator
    if (calc.user_id !== context.session.userId) {
      logger.warn(
        `Unauthorized access to calculator ${id} by user ${context.session.userId}`
      );
      throw new GraphQLError("Not authorized to view this calculator", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    // Fetch assessments in the same query
    const assessments = db
      .prepare(
        "SELECT * FROM assessments WHERE calculator_id = ? ORDER BY id ASC"
      )
      .all(id);

    // Add assessments to calculator object
    calc._assessments = assessments;

    return calc;
  },
};

/**
 * Calculator-related GraphQL mutations
 */
export const calculatorMutations = {
  /**
   * Creates a new calculator for the current user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.name - The name of the calculator
   * @param {number|null} args.min_desired_grade - Optional minimum desired grade
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The newly created calculator object
   * @throws {GraphQLError} - If user is not authenticated or if creation fails
   */
  createCalculator: (_parent, { name, min_desired_grade }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    try {
      const stmt = db.prepare(
        "INSERT INTO calculators (user_id, name, min_desired_grade) VALUES (?, ?, ?)"
      );
      const result = stmt.run(
        context.session.userId,
        name,
        min_desired_grade ?? null
      );
      const newCalculatorId = result.lastInsertRowid;

      // Fetch and return the newly created calculator
      const newCalculator = db
        .prepare("SELECT * FROM calculators WHERE id = ?")
        .get(newCalculatorId);

      // Initialize empty assessments array
      newCalculator._assessments = [];

      logger.info(
        `Calculator created: ID=${newCalculatorId}, Name=${name}, User=${context.session.userId}`
      );
      return newCalculator;
    } catch (error) {
      logger.error(`Error creating calculator: ${error.message}`, {
        error,
        userId: context.session.userId,
        name,
      });
      throw new GraphQLError("Failed to create calculator", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Updates an existing calculator and its assessments
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the calculator to update
   * @param {string} [args.name] - New name for the calculator (optional)
   * @param {number|null} [args.min_desired_grade] - New minimum desired grade (optional)
   * @param {Array} [args.assessments] - New list of assessments (optional)
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The updated calculator object
   * @throws {GraphQLError} - If user is not authenticated, calculator not found, or update fails
   */
  updateCalculator: (
    _parent,
    { id, name, min_desired_grade, assessments },
    context
  ) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify calculator exists and belongs to user
    const calculator = db
      .prepare("SELECT * FROM calculators WHERE id = ? AND user_id = ?")
      .get(id, context.session.userId);
    if (!calculator) {
      logger.warn(
        `Update attempted on non-existent or unauthorized calculator: ID=${id}, User=${context.session.userId}`
      );
      throw new GraphQLError("Calculator not found or access denied", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Update name and/or min_desired_grade if provided
        if (name !== undefined || min_desired_grade !== undefined) {
          const updates = [];
          const params = [];
          if (name !== undefined) {
            updates.push("name = ?");
            params.push(name);
          }
          // Handle null explicitly for min_desired_grade
          if (min_desired_grade !== undefined) {
            updates.push("min_desired_grade = ?");
            params.push(min_desired_grade);
          }
          if (updates.length > 0) {
            params.push(id);
            db.prepare(
              `UPDATE calculators SET ${updates.join(", ")} WHERE id = ?`
            ).run(...params);
          }
        }

        // Update assessments if provided: Delete existing and insert new ones
        if (assessments !== undefined) {
          // Delete existing assessments
          db.prepare("DELETE FROM assessments WHERE calculator_id = ?").run(id);

          // Insert new assessments
          if (assessments.length > 0) {
            const insertStmt = db.prepare(
              "INSERT INTO assessments (calculator_id, name, weight, grade) VALUES (?, ?, ?, ?)"
            );
            for (const assessment of assessments) {
              // Ensure grade is null if not provided or explicitly null
              const gradeToInsert =
                assessment.grade === undefined ? null : assessment.grade;
              insertStmt.run(
                id,
                assessment.name,
                assessment.weight,
                gradeToInsert
              );
            }
          }
        }
      });

      db_transaction();

      // Fetch and return the updated calculator
      const updatedCalculator = db
        .prepare("SELECT * FROM calculators WHERE id = ?")
        .get(id);

      // Fetch assessments for the updated calculator
      updatedCalculator._assessments = db
        .prepare(
          "SELECT * FROM assessments WHERE calculator_id = ? ORDER BY id ASC"
        )
        .all(id);

      logger.info(
        `Calculator updated: ID=${id}, User=${context.session.userId}`,
        {
          nameChanged: name !== undefined,
          gradeChanged: min_desired_grade !== undefined,
          assessmentsChanged: assessments !== undefined,
          assessmentCount: assessments?.length,
        }
      );

      return updatedCalculator;
    } catch (error) {
      logger.error(`Error updating calculator ID ${id}: ${error.message}`, {
        error,
        userId: context.session.userId,
        calculatorId: id,
      });
      throw new GraphQLError("Failed to update calculator", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Deletes a calculator and its associated assessments
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the calculator to delete
   * @param {Object} context - Request context containing session data
   * @returns {boolean} - True if deletion was successful
   * @throws {GraphQLError} - If user is not authenticated, calculator not found, or deletion fails
   */
  deleteCalculator: (_parent, { id }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify calculator exists and belongs to user
    const calculator = db
      .prepare("SELECT id FROM calculators WHERE id = ? AND user_id = ?")
      .get(id, context.session.userId);
    if (!calculator) {
      logger.warn(
        `Delete attempted on non-existent or unauthorized calculator: ID=${id}, User=${context.session.userId}`
      );
      throw new GraphQLError("Calculator not found or access denied", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Delete assessments first due to foreign key constraint
        db.prepare("DELETE FROM assessments WHERE calculator_id = ?").run(id);
        // Then delete the calculator
        const result = db
          .prepare("DELETE FROM calculators WHERE id = ?")
          .run(id);
        return result.changes > 0; // Return true if a row was deleted
      });

      const result = db_transaction();
      logger.info(
        `Calculator deleted: ID=${id}, User=${context.session.userId}`
      );
      return result;
    } catch (error) {
      logger.error(`Error deleting calculator ID ${id}: ${error.message}`, {
        error,
        userId: context.session.userId,
        calculatorId: id,
      });
      throw new GraphQLError("Failed to delete calculator", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
};

/**
 * Calculator type field resolvers to populate nested data
 */
export const calculatorTypeResolvers = {
  Calculator: {
    /**
     * Resolves the user who owns the calculator
     *
     * @param {Object} calculator - Parent calculator object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Object} - User object who owns the calculator
     * @throws {GraphQLError} - If user not found (data inconsistency)
     */
    user: (calculator, _args, context) => {
      logger.debug(
        `Fetching user for calculator ID: ${calculator.id}, User ID: ${calculator.user_id}`
      );
      const user = db
        .prepare("SELECT id, username FROM users WHERE id = ?")
        .get(calculator.user_id);
      if (!user) {
        logger.error(
          `Inconsistency: User ID ${calculator.user_id} not found for Calculator ID ${calculator.id}`
        );
        throw new GraphQLError("Calculator owner not found", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return user;
    },

    /**
     * Resolves the assessments associated with the calculator
     * Uses the preloaded assessments when available
     *
     * @param {Object} calculator - Parent calculator object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of assessment objects
     */
    assessments: (calculator, _args, context) => {
      // If assessments were preloaded, use them
      if (calculator._assessments) {
        return calculator._assessments;
      }

      // Fallback to fetching assessments if not preloaded
      logger.debug(`Fetching assessments for calculator ID: ${calculator.id}`);
      const assessments = db
        .prepare(
          "SELECT * FROM assessments WHERE calculator_id = ? ORDER BY id ASC"
        )
        .all(calculator.id);
      return assessments;
    },

    /**
     * Resolves the template the calculator was created from (if any)
     *
     * @param {Object} calculator - Parent calculator object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Object|null} - Template object or null if calculator wasn't created from a template
     */
    template: (calculator, _args, context) => {
      if (!calculator.template_id) {
        return null;
      }
      logger.debug(
        `Fetching template for calculator ID: ${calculator.id}, Template ID: ${calculator.template_id}`
      );
      const template = db
        .prepare(
          "SELECT * FROM calculator_templates WHERE id = ? AND deleted = 0"
        )
        .get(calculator.template_id);
      return template;
    },
  },
};
