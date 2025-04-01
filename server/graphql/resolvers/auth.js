/**
 * Authentication-related GraphQL resolvers
 *
 * This file contains all the resolvers related to user authentication and user data,
 * including queries for retrieving user data, mutations for user authentication
 * (registration, login, logout), and user type field resolvers.
 */

import db from "../../db.js";
import { GraphQLError } from "graphql";
import bcrypt from "bcrypt";
import { createLogger } from "../../utils/logger.js";

// Create a context-specific logger
const logger = createLogger("auth-resolver");

/**
 * Authentication-related GraphQL queries
 */
export const authQueries = {
  /**
   * Retrieves the currently logged-in user
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} _args - GraphQL arguments (unused)
   * @param {Object} context - Request context containing session data
   * @returns {Object|null} - User object if authenticated, null if not
   */
  me: (_parent, _args, context) => {
    // Check the session from the context
    if (!context.session?.userId) {
      return null; // Not logged in
    }
    // Fetch user details based on session userId
    logger.debug(`Fetching current user with ID: ${context.session.userId}`);
    const user = db
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .get(context.session.userId);
    // Normally user should exist if userId is in session, but handle gracefully
    return user;
  },

  /**
   * Retrieves a specific user by ID
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.id - The ID of the user to retrieve
   * @param {Object} context - Request context
   * @returns {Object|null} - User object if found, null otherwise
   */
  user: (_parent, { id }, context) => {
    logger.debug(`Fetching user with ID: ${id}`);
    const user = db
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .get(id);
    if (!user) {
      return null;
    }
    // Nested resolvers handle templates and courses if requested
    return user;
  },
};

/**
 * Authentication-related GraphQL mutations
 */
export const authMutations = {
  /**
   * Registers a new user account
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.username - The username for the new account
   * @param {string} args.password - The password for the new account (will be hashed)
   * @param {Object} context - Request context with session
   * @returns {Object} - The newly created user object
   * @throws {GraphQLError} - If registration fails (duplicate username, etc.)
   */
  register: async (_parent, { username, password }, context) => {
    if (!username || !password) {
      throw new GraphQLError("Username and password are required", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Validate username length
    if (username.length < 3 || username.length > 28) {
      throw new GraphQLError("Username must be between 3 and 28 characters", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Validate username characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new GraphQLError("Username can only contain letters, numbers, and underscores", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare(
        "INSERT INTO users (username, password) VALUES (?, ?)"
      );
      const result = stmt.run(username, hashedPassword);
      const newUserId = result.lastInsertRowid;

      // Log the user in immediately after registration by setting the session
      context.session.userId = newUserId;
      await new Promise((resolve, reject) => {
        context.req.session.save((err) => {
          if (err)
            reject(
              new GraphQLError("Failed to save session after registration", {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
              })
            );
          else resolve();
        });
      });

      // Fetch and return the newly registered user
      const newUser = db
        .prepare("SELECT id, username FROM users WHERE id = ?")
        .get(newUserId);
      logger.info(`New user registered: ${username} (ID: ${newUserId})`);
      return newUser;
    } catch (error) {
      // Handle unique constraint error for username
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        logger.warn(
          `Registration failed: Username already exists - ${username}`
        );
        throw new GraphQLError("Username already exists", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      logger.error(`Error during registration: ${error.message}`, { error });
      throw new GraphQLError("Registration failed", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },

  /**
   * Authenticates a user and creates a session
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} args - GraphQL arguments
   * @param {string} args.username - The username to authenticate
   * @param {string} args.password - The password to verify
   * @param {Object} context - Request context with session
   * @returns {Object} - The authenticated user object
   * @throws {GraphQLError} - If login fails (invalid credentials)
   */
  login: async (_parent, { username, password }, context) => {
    if (!username || !password) {
      throw new GraphQLError("Username and password are required", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      logger.warn(`Login failed: Invalid username - ${username}`);
      throw new GraphQLError("Invalid credentials", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logger.warn(
        `Login failed: Invalid password for user ${username} (ID: ${user.id})`
      );
      throw new GraphQLError("Invalid credentials", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Set the session userId
    context.session.userId = user.id;

    // Manually save the session before returning
    // This ensures the session cookie is set on the response
    await new Promise((resolve, reject) => {
      context.req.session.save((err) => {
        if (err) {
          logger.error(`Failed to save session after login: ${err.message}`, {
            error: err,
          });
          reject(
            new GraphQLError("Failed to save session after login", {
              extensions: { code: "INTERNAL_SERVER_ERROR" },
            })
          );
        } else resolve();
      });
    });

    logger.info(`User logged in: ${user.username} (ID: ${user.id})`);
    // Return only non-sensitive user data
    return { id: user.id, username: user.username };
  },

  /**
   * Logs out the current user by destroying their session
   *
   * @param {Object} _parent - Parent resolver object (unused)
   * @param {Object} _args - GraphQL arguments (unused)
   * @param {Object} context - Request context with session
   * @returns {boolean} - True if logout was successful
   * @throws {GraphQLError} - If logout fails
   */
  logout: async (_parent, _args, context) => {
    return new Promise((resolve, reject) => {
      if (context.req.session) {
        const userId = context.session.userId;
        context.req.session.destroy((err) => {
          if (err) {
            logger.error(`Error destroying session: ${err.message}`, {
              error: err,
            });
            reject(
              new GraphQLError("Logout failed", {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
              })
            );
          } else {
            // Optional: Clear cookie on client-side if needed, though destroying session should suffice
            // context.res.clearCookie('connect.sid'); // Adjust cookie name if necessary
            logger.info(`User logged out (ID: ${userId || "unknown"})`);
            resolve(true);
          }
        });
      } else {
        // No session to destroy
        logger.debug("Logout attempted with no active session");
        resolve(true);
      }
    });
  },
};

export const authTypeResolvers = {};
