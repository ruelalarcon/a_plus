/**
 * GraphQL client for making GraphQL requests
 */

const GRAPHQL_ENDPOINT = "/graphql";

/**
 * Execute a GraphQL query or mutation
 *
 * @param {string} query - The GraphQL query/mutation string
 * @param {Object} variables - Variables for the query/mutation
 * @param {RequestInit} options - Additional fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function executeQuery(query, variables = {}, options = {}) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify({
      query,
      variables,
    }),
    ...options,
  };

  const response = await fetch(GRAPHQL_ENDPOINT, fetchOptions);

  // Parse and handle GraphQL-specific errors
  const result = await response.json();

  if (result.errors) {
    // Create a custom error with GraphQL error details
    const error = new Error("GraphQL request failed");
    error.graphQLErrors = result.errors;
    error.response = response;
    throw error;
  }

  return result.data;
}

/**
 * Execute a GraphQL query
 *
 * @param {string} query - The GraphQL query string
 * @param {Object} variables - Variables for the query
 * @returns {Promise<any>} - Query result data
 */
export function query(queryStr, variables = {}) {
  return executeQuery(queryStr, variables);
}

/**
 * Execute a GraphQL mutation
 *
 * @param {string} mutation - The GraphQL mutation string
 * @param {Object} variables - Variables for the mutation
 * @returns {Promise<any>} - Mutation result data
 */
export function mutate(mutationStr, variables = {}) {
  return executeQuery(mutationStr, variables);
}
