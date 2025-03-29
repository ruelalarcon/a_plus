/**
 * User-related GraphQL resolvers
 *
 * This file contains resolvers related to user data beyond authentication,
 * including queries to fetch user content like templates and comments,
 * and type resolvers for the User type that handle related data relationships.
 */

import db from "../../db.js";
import { GraphQLError } from "graphql";
import { createLogger } from "../../utils/logger.js";

// Create a context-specific logger
const logger = createLogger("user-resolver");

/**
 * User-related GraphQL queries
 */
export const userQueries = {
  /**
   * Retrieves all comments created by a specific user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.userId - The ID of the user whose comments to retrieve
   * @param {Object} context - Request context containing session data
   * @returns {Array} - Array of comments made by the specified user
   */
  userComments: (_parent, { userId }, context) => {
    logger.debug(`Fetching comments for user ID: ${userId}`);

    // Query to get all the specified user's comments with template information
    const comments = db
      .prepare(
        `
        SELECT
            c.*,
            t.name as template_name,
            t.id as template_id,
            u.username as author_username
        FROM template_comments c
        JOIN calculator_templates t ON c.template_id = t.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
        `
      )
      .all(userId);

    // Transform results to include nested template and author objects
    const transformedComments = comments.map((comment) => {
      const { template_name, author_username, ...commentData } = comment;

      return {
        ...commentData,
        __typename: "TemplateComment",
        template: {
          id: comment.template_id,
          name: template_name,
          __typename: "CalculatorTemplate",
        },
        author: {
          id: comment.user_id,
          username: author_username,
          __typename: "User",
        },
      };
    });

    logger.debug(
      `Retrieved ${comments.length} comments for user ID: ${userId}`
    );
    return transformedComments;
  },
};

/**
 * User type field resolvers to populate nested data
 */
export const userTypeResolvers = {
  User: {
    /**
     * Retrieves all templates created by the user
     *
     * @param {Object} user - Parent user object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of templates belonging to the user
     */
    templates: (user, _args, context) => {
      logger.debug(`Fetching templates for user ID: ${user.id}`);

      // Comprehensive query to eager load all required template data in one go
      const templates = db
        .prepare(
          `
          SELECT
              t.*,
              u.id as creator_id,
              u.username as creator_username,
              COALESCE(v.vote, 0) as user_vote
          FROM calculator_templates t
          JOIN users u ON t.user_id = u.id
          LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
          WHERE t.user_id = ? AND t.deleted = 0
          ORDER BY t.created_at DESC
          `
        )
        .all(context.session?.userId || 0, user.id);

      // Transform results to include nested creator object with __typename
      // to make GraphQL recognize it as a complete object to avoid resolver calls
      const transformedTemplates = templates.map((template) => {
        // Remove properties that would make GraphQL think it needs to call resolvers
        const { creator_id, creator_username, ...templateData } = template;

        return {
          ...templateData,
          __typename: "CalculatorTemplate",
          creator: {
            id: creator_id,
            username: creator_username,
            __typename: "User",
          },
        };
      });

      logger.debug(
        `Retrieved ${templates.length} templates for user ID: ${user.id}`
      );
      return transformedTemplates;
    },

    /**
     * Retrieves all comments created by the user
     *
     * @param {Object} user - Parent user object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of comments made by the user
     */
    comments: (user, _args, context) => {
      logger.debug(`Fetching comments for user ID: ${user.id}`);

      // Query to get all user's comments with template information
      const comments = db
        .prepare(
          `
          SELECT
              c.*,
              t.name as template_name,
              t.id as template_id
          FROM template_comments c
          JOIN calculator_templates t ON c.template_id = t.id
          WHERE c.user_id = ?
          ORDER BY c.created_at DESC
          `
        )
        .all(user.id);

      // Transform results to include nested template object
      const transformedComments = comments.map((comment) => {
        const { template_name, ...commentData } = comment;

        return {
          ...commentData,
          __typename: "TemplateComment",
          template: {
            id: comment.template_id,
            name: template_name,
            __typename: "CalculatorTemplate",
          },
        };
      });

      logger.debug(
        `Retrieved ${comments.length} comments for user ID: ${user.id}`
      );
      return transformedComments;
    },

    /**
     * Retrieves all courses created by the user
     *
     * @param {Object} user - Parent user object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of courses belonging to the user
     * @throws {GraphQLError} - If requestor is not authorized to view these courses
     */
    courses: (user, _args, context) => {
      // Only return courses if this is the currently logged-in user
      if (user.id !== context.session?.userId) {
        logger.warn(
          `Unauthorized access to courses for user ${user.id} by user ${context.session?.userId}`
        );
        throw new GraphQLError("Not authorized to view these courses", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      logger.debug(`Fetching courses for user ID: ${user.id}`);

      // Fetch all courses with their prerequisites in a single query
      const results = db
        .prepare(
          `SELECT
              c.id, c.name, c.credits, c.completed, c.created_at, c.user_id,
              p.prerequisite_id,
              pc.id as prereq_id, pc.name as prereq_name, pc.credits as prereq_credits, pc.completed as prereq_completed
           FROM courses c
           LEFT JOIN course_prerequisites p ON c.id = p.course_id
           LEFT JOIN courses pc ON p.prerequisite_id = pc.id
           WHERE c.user_id = ?
           ORDER BY c.created_at ASC`
        )
        .all(user.id);

      if (results.length === 0) {
        return [];
      }

      // Group by course ID to construct the course objects with prerequisites
      const courseMap = new Map();

      for (const row of results) {
        // If we haven't seen this course before, add it to our map
        if (!courseMap.has(row.id)) {
          courseMap.set(row.id, {
            id: row.id,
            name: row.name,
            credits: row.credits,
            completed: row.completed,
            created_at: row.created_at,
            user_id: row.user_id,
            _prerequisites: [],
          });
        }

        // Add the prerequisite if it exists
        if (row.prerequisite_id) {
          const course = courseMap.get(row.id);
          course._prerequisites.push({
            id: row.prereq_id,
            name: row.prereq_name,
            credits: row.prereq_credits,
            completed: row.prereq_completed,
            user_id: user.id, // We know prerequisites belong to the same user
          });
        }
      }

      // Convert map values to array
      return Array.from(courseMap.values());
    },

    /**
     * Retrieves all calculators created by the user
     *
     * @param {Object} user - Parent user object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of calculators belonging to the user
     * @throws {GraphQLError} - If requestor is not authorized to view these calculators
     */
    calculators: (user, _args, context) => {
      // Only return calculators if this is the currently logged-in user
      if (user.id !== context.session?.userId) {
        logger.warn(
          `Unauthorized access to calculators for user ${user.id} by user ${context.session?.userId}`
        );
        throw new GraphQLError("Not authorized to view these calculators", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      logger.debug(`Fetching calculators for user ID: ${user.id}`);

      // Fetch all calculators
      const calculators = db
        .prepare(
          "SELECT * FROM calculators WHERE user_id = ? ORDER BY created_at DESC"
        )
        .all(user.id);

      if (calculators.length === 0) {
        logger.debug(`No calculators found for user: ${user.id}`);
        return [];
      }

      // Create a map to store calculator IDs and their assessments
      const calcMap = new Map();
      calculators.forEach((calculator) => {
        calculator._assessments = [];
        calcMap.set(calculator.id, calculator);
      });

      // Fetch all assessments for these calculators in a single query
      const placeholders = calculators.map(() => "?").join(",");
      const calculatorIds = calculators.map((calculator) => calculator.id);

      const allAssessments = db
        .prepare(
          `SELECT * FROM assessments
           WHERE calculator_id IN (${placeholders})
           ORDER BY id ASC`
        )
        .all(...calculatorIds);

      // Organize assessments into their respective calculators
      allAssessments.forEach((assessment) => {
        const calculator = calcMap.get(assessment.calculator_id);
        if (calculator) {
          calculator._assessments.push(assessment);
        }
      });

      logger.debug(
        `Retrieved ${calculators.length} calculators with their assessments`
      );
      return calculators;
    },
  },
};
