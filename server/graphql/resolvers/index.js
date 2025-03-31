/**
 * GraphQL Resolver Index
 *
 * This file serves as the central aggregation point for all GraphQL resolvers in the application.
 * It imports specific resolver modules (auth, courses, calculators, templates) and combines them
 * into a comprehensive resolvers object that is exported for use by the GraphQL server.
 *
 * The modular structure allows for:
 * - Better organization of code by domain/feature
 * - Easier maintenance and testing
 * - Clearer separation of concerns
 */

import { authQueries, authMutations, authTypeResolvers } from "./auth.js";
import {
  calculatorQueries,
  calculatorMutations,
  calculatorTypeResolvers,
} from "./calculators.js";
import {
  courseQueries,
  courseMutations,
  courseTypeResolvers,
} from "./courses.js";
import {
  templateQueries,
  templateMutations,
  templateTypeResolvers,
} from "./templates.js";
import { userQueries, userTypeResolvers } from "./users.js";

/**
 * Combined resolvers object containing all queries, mutations, and type resolvers
 *
 * Structure matches the GraphQL schema structure with:
 * - Query: All query resolvers grouped together
 * - Mutation: All mutation resolvers grouped together
 * - Type-specific resolvers: For handling relations and computed fields
 */
const resolvers = {
  Query: {
    health: () => "OK", // Test query

    // Import all queries
    ...authQueries,
    ...calculatorQueries,
    ...courseQueries,
    ...templateQueries,
    ...userQueries,
  },

  Mutation: {
    // Import all mutations
    ...authMutations,
    ...calculatorMutations,
    ...courseMutations,
    ...templateMutations,
  },

  // Import all type resolvers
  ...authTypeResolvers,
  ...calculatorTypeResolvers,
  ...courseTypeResolvers,
  ...templateTypeResolvers,
  ...userTypeResolvers,
};

export default resolvers;
