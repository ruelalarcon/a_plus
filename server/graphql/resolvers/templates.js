/**
 * Template-related GraphQL resolvers
 *
 * This file contains all the resolvers related to calculator templates,
 * including queries to fetch templates, mutations to create/update/delete/vote on
 * templates, and type resolvers for the Template and TemplateComment types.
 *
 * Templates represent shareable assessment configurations that users can
 * create, browse, vote on, comment on, and use as a basis for their own calculators.
 */

import db from "../../db.js";
import { GraphQLError } from "graphql";
import { createLogger } from "../../utils/logger.js";

// Create a context-specific logger
const logger = createLogger("template-resolver");

/**
 * Template-related GraphQL queries
 */
export const templateQueries = {
  /**
   * Retrieves a specific template by ID
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the template to retrieve
   * @param {Object} context - Request context containing session data
   * @returns {Object|null} - Template object if found and not deleted, null otherwise
   */
  template: (_parent, { id }, context) => {
    logger.debug(`Fetching template with ID: ${id}`);
    // We need to join users and votes here to get creator and user_vote
    const template = db
      .prepare(
        `
        SELECT t.*,
               u.username as creator_name, -- Alias to match resolver expected structure if needed
               COALESCE(v.vote, 0) as user_vote
        FROM calculator_templates t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
        WHERE t.id = ? AND t.deleted = 0
      `
      )
      .get(context.session?.userId ?? 0, id);

    if (!template) {
      logger.debug(`Template with ID: ${id} not found or deleted`);
      return null;
    }

    // Transform template to include properly formatted creator object
    const transformedTemplate = {
      ...template,
      __typename: "CalculatorTemplate",
      creator: {
        id: template.user_id,
        username: template.creator_name,
        __typename: "User",
      },
    };

    logger.debug(`Template with ID: ${id} found and transformed`);
    // Nested resolvers handle assessments and comments
    return transformedTemplate;
  },

  /**
   * Searches and retrieves templates with filtering, pagination, and sorting
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} [args.query] - Optional search term for name/term/institution
   * @param {string} [args.term] - Optional filter for template term
   * @param {number} [args.year] - Optional filter for template year
   * @param {string} [args.institution] - Optional filter for template institution
   * @param {number} [args.page=1] - Page number for pagination
   * @param {number} [args.limit=20] - Number of results per page
   * @param {Object} context - Request context containing session data
   * @returns {Object} - Object containing templates array, total count, page, and limit
   * @throws {GraphQLError} - If the search fails
   */
  allTemplates: (
    _parent,
    { query, term, year, institution, page = 1, limit = 20 },
    context
  ) => {
    const MAX_LIMIT = 100;
    const MIN_VOTES = -1;
    const safeLimit = Math.min(Number(limit) || 20, MAX_LIMIT);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    try {
      // Query to get total count of matching templates
      const countQuery = db
        .prepare(
          `
          SELECT COUNT(*) as total
          FROM calculator_templates t
          WHERE
              (t.name LIKE ? OR            -- Match on name
              t.term LIKE ? OR             -- Match on term
              t.year = ? OR                -- Exact year match
              t.institution LIKE ?) AND    -- Match on institution
              t.vote_count >= ? AND        -- Minimum vote threshold
              t.deleted = 0                -- Exclude deleted templates
      `
        )
        .get(
          `%${query || ""}%`,
          `%${term || ""}%`,
          year || 0,
          `%${institution || ""}%`,
          MIN_VOTES
        );

      // Complex search query with ranking - EXACTLY as in the REST API
      const templates = db
        .prepare(
          `
          SELECT
              t.*,
              u.username as creator_name,
              COALESCE(v.vote, 0) as user_vote,
              (
                  -- Calculate match score based on which fields match
                  CASE
                      WHEN t.name LIKE ? THEN 1
                      ELSE 0
                  END +
                  CASE
                      WHEN t.term LIKE ? THEN 1
                      ELSE 0
                  END +
                  CASE
                      WHEN t.year = ? THEN 1
                      ELSE 0
                  END +
                  CASE
                      WHEN t.institution LIKE ? THEN 1
                      ELSE 0
                  END
              ) as match_score
          FROM calculator_templates t
          JOIN users u ON t.user_id = u.id
          LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
          WHERE
              -- Match any field
              (t.name LIKE ? OR
              t.term LIKE ? OR
              t.year = ? OR
              t.institution LIKE ?) AND
              t.vote_count >= ? AND
              t.deleted = 0
          -- Order by:
          -- 1. Number of matching fields
          -- 2. Institution match priority
          -- 3. Name match priority
          -- 4. Term match priority
          -- 5. Vote count
          -- 6. Most recent
          ORDER BY match_score DESC,
              CASE WHEN t.institution LIKE ? THEN 0 ELSE 1 END,
              CASE WHEN t.name LIKE ? THEN 0 ELSE 1 END,
              CASE WHEN t.term LIKE ? THEN 0 ELSE 1 END,
              t.vote_count DESC,
              t.created_at DESC
          LIMIT ? OFFSET ?
      `
        )
        .all(
          `%${query || ""}%`,
          `%${term || ""}%`,
          year || 0,
          `%${institution || ""}%`,
          context.session?.userId ?? 0,
          `%${query || ""}%`,
          `%${term || ""}%`,
          year || 0,
          `%${institution || ""}%`,
          MIN_VOTES,
          `%${institution || ""}%`,
          `%${query || ""}%`,
          `%${term || ""}%`,
          safeLimit,
          offset
        );

      // Log search results
      logger.debug(
        `Found ${templates.length} templates (total count: ${countQuery.total})`
      );
      if (templates.length > 0) {
        logger.debug(
          `First template: id=${templates[0].id}, name="${templates[0].name}"`
        );
      }

      // Transform templates to include properly formatted creator objects
      const transformedTemplates = templates.map((template) => {
        return {
          ...template,
          __typename: "CalculatorTemplate",
          creator: {
            id: template.user_id,
            username: template.creator_name,
            __typename: "User",
          },
        };
      });

      return {
        templates: transformedTemplates,
        total: countQuery.total,
        page: safePage,
        limit: safeLimit,
      };
    } catch (error) {
      logger.error(`Error searching templates: ${error.message}`, {
        error,
        filters: { query, term, year, institution },
      });
      throw new GraphQLError("Failed to search templates", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Retrieves all comments for a specific template
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.templateId - The ID of the template to fetch comments for
   * @param {Object} context - Request context
   * @returns {Array} - Array of comment objects for the template
   * @throws {GraphQLError} - If template not found or is deleted
   */
  templateComments: (_parent, { templateId }, context) => {
    logger.debug(`Fetching comments for template ID: ${templateId}`);
    // Verify template exists and is not deleted
    const templateExists = db
      .prepare(
        "SELECT id FROM calculator_templates WHERE id = ? AND deleted = 0"
      )
      .get(templateId);
    if (!templateExists) {
      logger.warn(
        `Attempted to fetch comments for non-existent template: ${templateId}`
      );
      throw new GraphQLError("Template not found or deleted", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    // Fetch comments ordered by creation date
    const comments = db
      .prepare(
        "SELECT * FROM template_comments WHERE template_id = ? ORDER BY created_at DESC"
      )
      .all(templateId);
    // Nested resolvers will handle author/template fields
    logger.debug(
      `Retrieved ${comments.length} comments for template ID: ${templateId}`
    );
    return comments;
  },
};

/**
 * Template-related GraphQL mutations
 */
export const templateMutations = {
  /**
   * Creates a new calculator template
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.name - The name of the template
   * @param {string} args.term - The academic term (e.g., "Fall 2023")
   * @param {number} args.year - The academic year
   * @param {string} args.institution - The educational institution
   * @param {Array} args.assessments - Array of assessment objects with name and weight
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The newly created template object
   * @throws {GraphQLError} - If user is not authenticated, no assessments provided, or creation fails
   */
  createTemplate: (
    _parent,
    { name, term, year, institution, assessments },
    context
  ) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (!assessments || assessments.length === 0) {
      throw new GraphQLError("Template must have at least one assessment", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Create template with initial vote count of 1
        const templateStmt = db.prepare(
          "INSERT INTO calculator_templates (user_id, name, term, year, institution, vote_count) VALUES (?, ?, ?, ?, ?, 1)"
        );
        const result = templateStmt.run(
          context.session.userId,
          name,
          term,
          year,
          institution
        );
        const templateId = result.lastInsertRowid;

        // Add creator's automatic upvote
        db.prepare(
          "INSERT INTO template_votes (template_id, user_id, vote) VALUES (?, ?, 1)"
        ).run(templateId, context.session.userId);

        // Add assessments
        const assessmentStmt = db.prepare(
          "INSERT INTO template_assessments (template_id, name, weight) VALUES (?, ?, ?)"
        );
        for (const assessment of assessments) {
          assessmentStmt.run(templateId, assessment.name, assessment.weight);
        }

        return templateId;
      });

      const newTemplateId = db_transaction();

      // Fetch and return the newly created template
      // Nested resolvers will handle creator/assessments
      const newTemplate = db
        .prepare("SELECT * FROM calculator_templates WHERE id = ?")
        .get(newTemplateId);

      logger.info(
        `Template created: ID=${newTemplateId}, Name=${name}, User=${context.session.userId}`,
        {
          assessmentCount: assessments.length,
          term,
          year,
          institution,
        }
      );
      return newTemplate;
    } catch (error) {
      logger.error(`Error creating template: ${error.message}`, {
        error,
        userId: context.session.userId,
        name,
        term,
        year,
        institution,
        assessmentCount: assessments?.length,
      });
      // Handle potential unique constraint errors if needed
      throw new GraphQLError("Failed to create template", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Soft-deletes a template (marks it as deleted)
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the template to delete
   * @param {Object} context - Request context containing session data
   * @returns {boolean} - True if deletion was successful
   * @throws {GraphQLError} - If user is not authenticated, template not found, or doesn't belong to user
   */
  deleteTemplate: (_parent, { id }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify template exists and belongs to the user
    const template = db
      .prepare(
        "SELECT id FROM calculator_templates WHERE id = ? AND user_id = ?"
      )
      .get(id, context.session.userId);
    if (!template) {
      logger.warn(
        `Delete attempted on non-existent or unauthorized template: ID=${id}, User=${context.session.userId}`
      );
      throw new GraphQLError("Template not found or access denied", {
        extensions: { code: "NOT_FOUND" },
      });
      // return false;
    }

    try {
      // Soft delete: Mark template as deleted
      const result = db
        .prepare("UPDATE calculator_templates SET deleted = 1 WHERE id = ?")
        .run(id);

      logger.info(`Template deleted: ID=${id}, User=${context.session.userId}`);
      return result.changes > 0; // Return true if updated
    } catch (error) {
      logger.error(`Error deleting template ID ${id}: ${error.message}`, {
        error,
        userId: context.session.userId,
        templateId: id,
      });
      throw new GraphQLError("Failed to delete template", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Creates a new calculator from an existing template
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.templateId - The ID of the template to use
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The newly created calculator object
   * @throws {GraphQLError} - If user is not authenticated, template not found, or creation fails
   */
  useTemplate: (_parent, { templateId }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify template exists and is not deleted
    const template = db
      .prepare(
        "SELECT * FROM calculator_templates WHERE id = ? AND deleted = 0"
      )
      .get(templateId);
    if (!template) {
      logger.warn(
        `Use template attempted with non-existent template: ID=${templateId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Template not found or is deleted", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Create new calculator with template reference
        const calcStmt = db.prepare(
          "INSERT INTO calculators (user_id, name, template_id) VALUES (?, ?, ?)"
        );
        const result = calcStmt.run(
          context.session.userId,
          template.name,
          template.id
        );
        const calculatorId = result.lastInsertRowid;

        // Copy template assessments
        const templateAssessments = db
          .prepare("SELECT * FROM template_assessments WHERE template_id = ?")
          .all(template.id);
        const assessmentStmt = db.prepare(
          "INSERT INTO assessments (calculator_id, name, weight, grade) VALUES (?, ?, ?, NULL)"
        );
        for (const assessment of templateAssessments) {
          assessmentStmt.run(calculatorId, assessment.name, assessment.weight);
        }

        return calculatorId;
      });

      const newCalculatorId = db_transaction();

      // Fetch and return the newly created calculator
      const newCalculator = db
        .prepare("SELECT * FROM calculators WHERE id = ?")
        .get(newCalculatorId);

      logger.info(
        `Calculator created from template: Calculator ID=${newCalculatorId}, Template ID=${templateId}, User=${context.session.userId}`
      );
      return newCalculator;
    } catch (error) {
      logger.error(`Error using template ID ${templateId}: ${error.message}`, {
        error,
        userId: context.session.userId,
        templateId,
      });
      throw new GraphQLError("Failed to create calculator from template", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Votes on a template (upvote or downvote)
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.templateId - The ID of the template to vote on
   * @param {number} args.vote - The vote value (1 for upvote, -1 for downvote)
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The updated template object
   * @throws {GraphQLError} - If user is not authenticated, template not found, invalid vote value,
   *                          trying to vote on own template, or voting fails
   */
  voteTemplate: (_parent, { templateId, vote }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (vote !== 1 && vote !== -1) {
      throw new GraphQLError("Invalid vote value. Must be 1 or -1.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const template = db
      .prepare(
        "SELECT id, user_id FROM calculator_templates WHERE id = ? AND deleted = 0"
      )
      .get(templateId);
    if (!template) {
      logger.warn(
        `Vote attempted on non-existent template: ID=${templateId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Template not found or deleted", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Prevent voting on own templates
    if (template.user_id === context.session.userId) {
      logger.warn(
        `User attempted to vote on their own template: Template ID=${templateId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Cannot vote on your own template", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Get existing vote if any
        const existingVote = db
          .prepare(
            "SELECT vote FROM template_votes WHERE template_id = ? AND user_id = ?"
          )
          .get(template.id, context.session.userId);
        let voteChange = vote;

        if (existingVote) {
          if (existingVote.vote === vote) {
            // User is casting the same vote again - effectively no change in total count
            voteChange = 0;
          } else {
            // User is changing their vote (e.g., -1 to 1)
            // Old vote needs to be removed (- (-1) = +1), new vote added (+1) -> net change +2
            // Old vote needs to be removed (- 1 = -1), new vote added (-1) -> net change -2
            voteChange = vote - existingVote.vote;
            // Update the vote record
            db.prepare(
              "UPDATE template_votes SET vote = ? WHERE template_id = ? AND user_id = ?"
            ).run(vote, template.id, context.session.userId);
          }
        } else {
          // Insert new vote
          db.prepare(
            "INSERT INTO template_votes (template_id, user_id, vote) VALUES (?, ?, ?)"
          ).run(template.id, context.session.userId, vote);
          // voteChange remains the value of the new vote (1 or -1)
        }

        // Update template vote count only if there was a net change
        if (voteChange !== 0) {
          db.prepare(
            "UPDATE calculator_templates SET vote_count = vote_count + ? WHERE id = ?"
          ).run(voteChange, template.id);
        }
      });

      db_transaction();

      // Fetch and return the updated template with user_vote information
      const updatedTemplate = db
        .prepare(
          `
              SELECT t.*,
                   COALESCE(v.vote, 0) as user_vote
              FROM calculator_templates t
              LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
              WHERE t.id = ?
          `
        )
        .get(context.session.userId, templateId);

      logger.info(
        `User voted on template: Template ID=${templateId}, User=${context.session.userId}, Vote=${vote}`
      );
      return updatedTemplate;
    } catch (error) {
      logger.error(
        `Error voting on template ID ${templateId}: ${error.message}`,
        {
          error,
          userId: context.session.userId,
          templateId,
          vote,
        }
      );
      throw new GraphQLError("Failed to vote on template", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Removes a user's vote from a template
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.templateId - The ID of the template to remove vote from
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The updated template object
   * @throws {GraphQLError} - If user is not authenticated, template not found,
   *                          trying to remove vote from own template, or removal fails
   */
  removeTemplateVote: (_parent, { templateId }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const template = db
      .prepare(
        "SELECT id, user_id FROM calculator_templates WHERE id = ? AND deleted = 0"
      )
      .get(templateId);
    if (!template) {
      logger.warn(
        `Vote removal attempted on non-existent template: ID=${templateId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Template not found or deleted", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (template.user_id === context.session.userId) {
      logger.warn(
        `User attempted to remove vote from their own template: Template ID=${templateId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Cannot remove vote from your own template", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    try {
      const db_transaction = db.transaction(() => {
        const existingVote = db
          .prepare(
            "SELECT vote FROM template_votes WHERE template_id = ? AND user_id = ?"
          )
          .get(template.id, context.session.userId);
        let voteChange = 0;
        if (existingVote) {
          voteChange = -existingVote.vote;
          db.prepare(
            "DELETE FROM template_votes WHERE template_id = ? AND user_id = ?"
          ).run(template.id, context.session.userId);
          db.prepare(
            "UPDATE calculator_templates SET vote_count = vote_count + ? WHERE id = ?"
          ).run(voteChange, template.id);
        }
      });
      db_transaction();

      // Fetch and return the updated template with user_vote information
      const updatedTemplate = db
        .prepare(
          `
              SELECT t.*,
                   COALESCE(v.vote, 0) as user_vote
              FROM calculator_templates t
              LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
              WHERE t.id = ?
          `
        )
        .get(context.session.userId, templateId);

      logger.info(
        `User removed vote from template: Template ID=${templateId}, User=${context.session.userId}`
      );
      return updatedTemplate;
    } catch (error) {
      logger.error(
        `Error removing vote from template ID ${templateId}: ${error.message}`,
        {
          error,
          userId: context.session.userId,
          templateId,
        }
      );
      throw new GraphQLError("Failed to remove vote from template", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Adds a comment to a template
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.templateId - The ID of the template to comment on
   * @param {string} args.content - The comment text content
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The newly created comment object
   * @throws {GraphQLError} - If user is not authenticated, template not found, empty comment, or creation fails
   */
  addTemplateComment: (_parent, { templateId, content }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (!content || !content.trim()) {
      throw new GraphQLError("Comment content cannot be empty", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Verify template exists and is not deleted
    const templateExists = db
      .prepare(
        "SELECT id FROM calculator_templates WHERE id = ? AND deleted = 0"
      )
      .get(templateId);
    if (!templateExists) {
      logger.warn(
        `Comment attempted on non-existent template: ID=${templateId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Template not found or deleted", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    try {
      const stmt = db.prepare(
        "INSERT INTO template_comments (template_id, user_id, content) VALUES (?, ?, ?)"
      );
      // Use CURRENT_TIMESTAMP for created_at and updated_at by default
      const result = stmt.run(
        templateId,
        context.session.userId,
        content.trim()
      );
      const newCommentId = result.lastInsertRowid;

      // Fetch and return the newly created comment
      // Include a join to get author username
      const newComment = db
        .prepare(
          `
              SELECT c.*, u.username as author_username
              FROM template_comments c
              JOIN users u ON c.user_id = u.id
              WHERE c.id = ?
          `
        )
        .get(newCommentId);

      logger.info(
        `Comment added to template: Comment ID=${newCommentId}, Template ID=${templateId}, User=${context.session.userId}`
      );

      // Format the response to match our GraphQL schema expectations
      return {
        ...newComment,
        author: {
          id: newComment.user_id,
          username: newComment.author_username,
        },
      };
    } catch (error) {
      logger.error(
        `Error adding comment to template ID ${templateId}: ${error.message}`,
        {
          error,
          userId: context.session.userId,
          templateId,
          contentLength: content?.length,
        }
      );
      throw new GraphQLError("Failed to add comment", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Updates an existing template comment
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.commentId - The ID of the comment to update
   * @param {string} args.content - The new comment text content
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The updated comment object
   * @throws {GraphQLError} - If user is not authenticated, comment not found,
   *                          empty comment, not the comment author, or update fails
   */
  updateTemplateComment: (_parent, { commentId, content }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (!content || !content.trim()) {
      throw new GraphQLError("Comment content cannot be empty", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Verify comment exists and belongs to the user
    const comment = db
      .prepare("SELECT id, user_id FROM template_comments WHERE id = ?")
      .get(commentId);
    if (!comment) {
      logger.warn(
        `Update attempted on non-existent comment: ID=${commentId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Comment not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (comment.user_id !== context.session.userId) {
      logger.warn(
        `User attempted to update another user's comment: Comment ID=${commentId}, Comment Owner=${comment.user_id}, Requesting User=${context.session.userId}`
      );
      throw new GraphQLError("Not authorized to update this comment", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    try {
      // Update content and set updated_at to current time
      const stmt = db.prepare(
        "UPDATE template_comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      stmt.run(content.trim(), commentId);

      // Fetch and return the updated comment
      // Include a join to get author username which will be useful for the response
      const updatedComment = db
        .prepare(
          `
              SELECT c.*, u.username as author_username
              FROM template_comments c
              JOIN users u ON c.user_id = u.id
              WHERE c.id = ?
          `
        )
        .get(commentId);

      logger.info(
        `Comment updated: Comment ID=${commentId}, User=${context.session.userId}`
      );

      // Format the response to match our GraphQL schema expectations
      return {
        ...updatedComment,
        author: {
          id: updatedComment.user_id,
          username: updatedComment.author_username,
        },
      };
    } catch (error) {
      logger.error(`Error updating comment ID ${commentId}: ${error.message}`, {
        error,
        userId: context.session.userId,
        commentId,
        contentLength: content?.length,
      });
      throw new GraphQLError("Failed to update comment", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Deletes a template comment
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.commentId - The ID of the comment to delete
   * @param {Object} context - Request context containing session data
   * @returns {boolean} - True if deletion was successful
   * @throws {GraphQLError} - If user is not authenticated, comment not found,
   *                          not the comment author, or deletion fails
   */
  deleteTemplateComment: (_parent, { commentId }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify comment exists and belongs to the user
    const comment = db
      .prepare("SELECT id, user_id FROM template_comments WHERE id = ?")
      .get(commentId);
    if (!comment) {
      logger.warn(
        `Delete attempted on non-existent comment: ID=${commentId}, User=${context.session.userId}`
      );
      throw new GraphQLError("Comment not found", {
        extensions: { code: "NOT_FOUND" },
      });
      // return false; // Alternative
    }
    if (comment.user_id !== context.session.userId) {
      logger.warn(
        `User attempted to delete another user's comment: Comment ID=${commentId}, Comment Owner=${comment.user_id}, Requesting User=${context.session.userId}`
      );
      throw new GraphQLError("Not authorized to delete this comment", {
        extensions: { code: "FORBIDDEN" },
      });
      // return false; // Alternative
    }

    try {
      const result = db
        .prepare("DELETE FROM template_comments WHERE id = ?")
        .run(commentId);
      logger.info(
        `Comment deleted: Comment ID=${commentId}, User=${context.session.userId}`
      );
      return result.changes > 0; // Return true if a row was deleted
    } catch (error) {
      logger.error(`Error deleting comment ID ${commentId}: ${error.message}`, {
        error,
        userId: context.session.userId,
        commentId,
      });
      throw new GraphQLError("Failed to delete comment", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
};

/**
 * Template and TemplateComment type field resolvers
 */
export const templateTypeResolvers = {
  CalculatorTemplate: {
    /**
     * Resolves the creator (user) of the template
     *
     * @param {Object} template - Parent template object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Object} - User object who created the template
     * @throws {GraphQLError} - If creator not found (data inconsistency)
     */
    creator: (template, _args, context) => {
      // Fast path - if creator is directly available with the right format
      // Don't log the fast path to avoid log clutter
      if (template.creator?.id && template.creator?.username) {
        return template.creator;
      }

      // Log non-optimized paths
      if (template.creator_name) {
        logger.debug(
          `Using prefetched creator name for template ID: ${template.id}`
        );
        return { id: template.user_id, username: template.creator_name };
      }

      logger.debug(
        `Fetching creator for template ID (fallback): ${template.id}, User ID: ${template.user_id}`
      );
      const user = db
        .prepare("SELECT id, username FROM users WHERE id = ?")
        .get(template.user_id);
      if (!user) {
        logger.error(
          `Inconsistency: Creator User ID ${template.user_id} not found for Template ID ${template.id}`
        );
        throw new GraphQLError("Template creator not found", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return user;
    },

    /**
     * Resolves the assessments associated with the template
     *
     * @param {Object} template - Parent template object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of assessment objects
     */
    assessments: (template, _args, context) => {
      logger.debug(`Fetching assessments for template ID: ${template.id}`);
      const assessments = db
        .prepare(
          "SELECT * FROM template_assessments WHERE template_id = ? ORDER BY id ASC"
        )
        .all(template.id);
      return assessments;
    },

    /**
     * Resolves the comments associated with the template
     *
     * @param {Object} template - Parent template object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of comment objects
     */
    comments: (template, _args, context) => {
      logger.debug(
        `Fetching comments for template ID (nested): ${template.id}`
      );
      const comments = db
        .prepare(
          "SELECT * FROM template_comments WHERE template_id = ? ORDER BY created_at DESC"
        )
        .all(template.id);
      return comments;
    },
  },

  TemplateComment: {
    /**
     * Resolves the template that this comment belongs to
     *
     * @param {Object} comment - Parent comment object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Object} - Template object
     * @throws {GraphQLError} - If template not found (data inconsistency)
     */
    template: (comment, _args, context) => {
      logger.debug(
        `Fetching template for comment ID: ${comment.id}, Template ID: ${comment.template_id}`
      );
      // Assuming template still exists; might return null if template was hard-deleted (we use soft delete)
      const template = db
        .prepare("SELECT * FROM calculator_templates WHERE id = ?")
        .get(comment.template_id);
      if (!template) {
        // This might happen if the template was hard-deleted, or data inconsistency
        logger.warn(
          `Template ${comment.template_id} not found for comment ${comment.id}`
        );
        throw new GraphQLError("Comment's parent template not found", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return template;
    },

    /**
     * Resolves the author (user) of the comment
     *
     * @param {Object} comment - Parent comment object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Object} - User object who wrote the comment
     * @throws {GraphQLError} - If author not found (data inconsistency)
     */
    author: (comment, _args, context) => {
      logger.debug(
        `Fetching author for comment ID: ${comment.id}, User ID: ${comment.user_id}`
      );
      const user = db
        .prepare("SELECT id, username FROM users WHERE id = ?")
        .get(comment.user_id);
      if (!user) {
        logger.error(
          `Inconsistency: Author User ID ${comment.user_id} not found for Comment ID ${comment.id}`
        );
        throw new GraphQLError("Comment author not found", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return user;
    },
  },
};
