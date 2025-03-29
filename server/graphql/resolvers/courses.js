/**
 * Course-related GraphQL resolvers
 *
 * This file contains all the resolvers related to courses, including queries
 * to fetch courses, mutations to create/update/delete courses, and type resolvers
 * for the Course type that handle related data like prerequisites.
 *
 * Courses can have prerequisite relationships with other courses, which are managed
 * through a many-to-many relationship in the database.
 */

import db from "../../db.js";
import { GraphQLError } from "graphql";

/**
 * Course-related GraphQL queries
 */
export const courseQueries = {
  /**
   * Retrieves a specific course by ID for the current user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the course to retrieve
   * @param {Object} context - Request context containing session data
   * @returns {Object|null} - Course object if found and belongs to user, null otherwise
   * @throws {GraphQLError} - If user is not authenticated
   */
  course: (_parent, { id }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    console.log(
      `Fetching course with ID: ${id} for user: ${context.session.userId}`
    );

    // Fetch the course
    const course = db
      .prepare("SELECT * FROM courses WHERE id = ? AND user_id = ?")
      .get(id, context.session.userId);

    if (!course) {
      return null;
    }

    // Fetch prerequisites in the same query
    const prerequisites = db
      .prepare(
        `SELECT c.* FROM courses c
         JOIN course_prerequisites p ON c.id = p.prerequisite_id
         WHERE p.course_id = ?`
      )
      .all(id);

    // Add prerequisites to course object
    course._prerequisites = prerequisites;

    return course;
  },

  /**
   * Retrieves all courses belonging to the current user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} _args - GraphQL arguments (unused)
   * @param {Object} context - Request context containing session data
   * @returns {Array} - Array of course objects belonging to the user
   * @throws {GraphQLError} - If user is not authenticated
   */
  myCourses: (_parent, _args, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    console.log(`Fetching all courses for user: ${context.session.userId}`);

    // Fetch all courses
    const courses = db
      .prepare(
        "SELECT * FROM courses WHERE user_id = ? ORDER BY created_at ASC"
      )
      .all(context.session.userId);

    if (courses.length === 0) {
      return [];
    }

    // Create a map to store course IDs and their prerequisites
    const courseMap = new Map();
    courses.forEach((course) => {
      course._prerequisites = [];
      courseMap.set(course.id, course);
    });

    // Fetch all prerequisites for these courses in a single query
    const placeholders = courses.map(() => "?").join(",");
    const courseIds = courses.map((course) => course.id);

    const allPrerequisites = db
      .prepare(
        `SELECT p.course_id, c.*
         FROM courses c
         JOIN course_prerequisites p ON c.id = p.prerequisite_id
         WHERE p.course_id IN (${placeholders})`
      )
      .all(...courseIds);

    // Organize prerequisites into their respective courses
    allPrerequisites.forEach((row) => {
      const course = courseMap.get(row.course_id);
      if (course) {
        // Remove the course_id from the prerequisite data
        const prerequisite = { ...row };
        delete prerequisite.course_id;
        course._prerequisites.push(prerequisite);
      }
    });

    return courses;
  },
};

/**
 * Course-related GraphQL mutations
 */
export const courseMutations = {
  /**
   * Creates a new course for the current user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.name - The name of the course
   * @param {Array} [args.prerequisiteIds] - Optional array of course IDs that are prerequisites
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The newly created course object
   * @throws {GraphQLError} - If user is not authenticated, prerequisite course not found, or creation fails
   */
  createCourse: (_parent, { name, prerequisiteIds }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const resolvedPrerequisiteIds = prerequisiteIds ?? [];

    try {
      const db_transaction = db.transaction(() => {
        // Create course
        const courseStmt = db.prepare(
          "INSERT INTO courses (user_id, name) VALUES (?, ?)"
        );
        const result = courseStmt.run(context.session.userId, name);
        const courseId = result.lastInsertRowid;

        // Add prerequisites
        if (resolvedPrerequisiteIds.length > 0) {
          // Verify prerequisite courses exist and belong to the user
          const placeholders = resolvedPrerequisiteIds.map(() => "?").join(",");
          const existingPrereqs = db
            .prepare(
              `SELECT id FROM courses WHERE id IN (${placeholders}) AND user_id = ?`
            )
            .all(...resolvedPrerequisiteIds, context.session.userId);
          if (existingPrereqs.length !== resolvedPrerequisiteIds.length) {
            throw new GraphQLError(
              "One or more prerequisite courses not found or not owned by user",
              { extensions: { code: "BAD_USER_INPUT" } }
            );
          }

          // Insert into join table
          const prereqStmt = db.prepare(
            "INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES (?, ?)"
          );
          for (const prereqId of resolvedPrerequisiteIds) {
            prereqStmt.run(courseId, prereqId);
          }
        }
        return courseId;
      });

      const newCourseId = db_transaction();

      // Fetch and return the newly created course
      const newCourse = db
        .prepare("SELECT * FROM courses WHERE id = ?")
        .get(newCourseId);

      // Fetch prerequisites for the new course
      if (resolvedPrerequisiteIds.length > 0) {
        newCourse._prerequisites = db
          .prepare(
            `SELECT c.* FROM courses c
             JOIN course_prerequisites p ON c.id = p.prerequisite_id
             WHERE p.course_id = ?`
          )
          .all(newCourseId);
      } else {
        newCourse._prerequisites = [];
      }

      return newCourse;
    } catch (error) {
      console.error("Error creating course:", error);
      // Rethrow specific errors like BAD_USER_INPUT
      if (
        error instanceof GraphQLError &&
        error.extensions?.code === "BAD_USER_INPUT"
      ) {
        throw error;
      }
      throw new GraphQLError("Failed to create course", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Updates an existing course and its prerequisites
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the course to update
   * @param {string} [args.name] - New name for the course (optional)
   * @param {boolean} [args.completed] - Whether the course is completed (optional)
   * @param {Array} [args.prerequisiteIds] - New list of prerequisite course IDs (optional)
   * @param {Object} context - Request context containing session data
   * @returns {Object} - The updated course object
   * @throws {GraphQLError} - If user is not authenticated, course not found, prerequisite issues, or update fails
   */
  updateCourse: (
    _parent,
    { id, name, completed, prerequisiteIds },
    context
  ) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify course exists and belongs to user
    const course = db
      .prepare("SELECT id FROM courses WHERE id = ? AND user_id = ?")
      .get(id, context.session.userId);
    if (!course) {
      throw new GraphQLError("Course not found or access denied", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Update course details (name, completed)
        if (name !== undefined || completed !== undefined) {
          const updates = [];
          const params = [];
          if (name !== undefined) {
            updates.push("name = ?");
            params.push(name);
          }
          if (completed !== undefined) {
            updates.push("completed = ?");
            params.push(completed ? 1 : 0);
          }
          if (updates.length > 0) {
            params.push(id);
            db.prepare(
              `UPDATE courses SET ${updates.join(", ")} WHERE id = ?`
            ).run(...params);
          }
        }

        // Update prerequisites if provided
        if (prerequisiteIds !== undefined) {
          // Remove existing prerequisites for this course
          // IMPORTANT: Only delete where course_id is the current course, not where prerequisite_id is the current course
          db.prepare(
            "DELETE FROM course_prerequisites WHERE course_id = ?"
          ).run(id);

          const resolvedPrerequisiteIds = prerequisiteIds ?? [];

          // Add new prerequisites
          if (resolvedPrerequisiteIds.length > 0) {
            // Verify prerequisite courses exist and belong to the user
            const placeholders = resolvedPrerequisiteIds
              .map(() => "?")
              .join(",");
            const existingPrereqs = db
              .prepare(
                `SELECT id FROM courses WHERE id IN (${placeholders}) AND user_id = ?`
              )
              .all(...resolvedPrerequisiteIds, context.session.userId);
            if (existingPrereqs.length !== resolvedPrerequisiteIds.length) {
              throw new GraphQLError(
                "One or more prerequisite courses not found or not owned by user",
                { extensions: { code: "BAD_USER_INPUT" } }
              );
            }
            // Prevent setting course as its own prerequisite
            if (resolvedPrerequisiteIds.includes(id)) {
              throw new GraphQLError(
                "A course cannot be its own prerequisite.",
                { extensions: { code: "BAD_USER_INPUT" } }
              );
            }

            // Insert into join table
            const prereqStmt = db.prepare(
              "INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES (?, ?)"
            );
            for (const prereqId of resolvedPrerequisiteIds) {
              prereqStmt.run(id, prereqId);
            }
          }
        }
      });

      db_transaction();

      // Fetch and return the updated course
      const updatedCourse = db
        .prepare("SELECT * FROM courses WHERE id = ?")
        .get(id);

      // Fetch prerequisites for the updated course
      updatedCourse._prerequisites = db
        .prepare(
          `SELECT c.* FROM courses c
           JOIN course_prerequisites p ON c.id = p.prerequisite_id
           WHERE p.course_id = ?`
        )
        .all(id);

      return updatedCourse;
    } catch (error) {
      console.error(`Error updating course ID ${id}:`, error);
      // Rethrow specific errors like BAD_USER_INPUT
      if (
        error instanceof GraphQLError &&
        error.extensions?.code === "BAD_USER_INPUT"
      ) {
        throw error;
      }
      throw new GraphQLError("Failed to update course", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Deletes a course and its prerequisite relationships
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the course to delete
   * @param {Object} context - Request context containing session data
   * @returns {boolean} - True if deletion was successful
   * @throws {GraphQLError} - If user is not authenticated, course not found, or deletion fails
   */
  deleteCourse: (_parent, { id }, context) => {
    if (!context.session?.userId) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verify course exists and belongs to user
    const course = db
      .prepare("SELECT id FROM courses WHERE id = ? AND user_id = ?")
      .get(id, context.session.userId);
    if (!course) {
      throw new GraphQLError("Course not found or access denied", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    try {
      const db_transaction = db.transaction(() => {
        // Delete prerequisites associated with this course (where it's the course_id OR the prerequisite_id)
        db.prepare(
          "DELETE FROM course_prerequisites WHERE course_id = ? OR prerequisite_id = ?"
        ).run(id, id);
        // Then delete the course
        const result = db.prepare("DELETE FROM courses WHERE id = ?").run(id);
        return result.changes > 0; // Return true if a row was deleted
      });

      return db_transaction();
    } catch (error) {
      console.error(`Error deleting course ID ${id}:`, error);
      throw new GraphQLError("Failed to delete course", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
};

/**
 * Course type field resolvers to populate nested data
 */
export const courseTypeResolvers = {
  Course: {
    /**
     * Resolves the user who owns the course
     *
     * @param {Object} course - Parent course object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Object} - User object who owns the course
     * @throws {GraphQLError} - If user not found (data inconsistency)
     */
    user: (course, _args, context) => {
      console.log(
        `Fetching user for course ID: ${course.id}, User ID: ${course.user_id}`
      );
      const user = db
        .prepare("SELECT id, username FROM users WHERE id = ?")
        .get(course.user_id);
      if (!user) {
        console.error(
          `Inconsistency: User ID ${course.user_id} not found for Course ID ${course.id}`
        );
        throw new GraphQLError("Course owner not found", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return user;
    },

    /**
     * Resolves the prerequisite courses for this course
     * Uses the preloaded prerequisites when available
     *
     * @param {Object} course - Parent course object
     * @param {Object} _args - GraphQL arguments (unused)
     * @param {Object} context - Request context
     * @returns {Array} - Array of prerequisite course objects
     */
    prerequisites: (course, _args, context) => {
      // If prerequisites were preloaded, use them
      if (course._prerequisites) {
        return course._prerequisites;
      }

      // Fallback to fetching prerequisites if not preloaded
      console.log(`Fetching prerequisites for course ID: ${course.id}`);
      const prerequisites = db
        .prepare(
          `
          SELECT c.* FROM courses c
          JOIN course_prerequisites p ON c.id = p.prerequisite_id
          WHERE p.course_id = ?
        `
        )
        .all(course.id);
      return prerequisites;
    },
  },
};
