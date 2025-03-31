/**
 * @module stores
 * Authentication state management module using Svelte stores
 */

import { writable } from "svelte/store";
import { navigate } from "svelte-routing";
import { query, mutate } from "./graphql/client.js";
import { ME } from "./graphql/queries.js";
import { LOGOUT } from "./graphql/mutations.js";

/**
 * Store containing the current user's ID
 * @type {import('svelte/store').Writable<number|null>}
 */
export const userId = writable(null);

/**
 * Store containing the current user's username
 * @type {import('svelte/store').Writable<string|null>}
 */
export const username = writable(null);

/**
 * Checks the current user's login status by making a GraphQL API call
 * Updates userId and username stores based on the response
 * @async
 * @returns {Promise<boolean>} Returns true if user is logged in, false otherwise
 */
export async function updateSessionState() {
  try {
    const data = await query(ME);

    if (data.me) {
      userId.set(data.me.id);
      username.set(data.me.username);
      return true;
    } else {
      // Clear the stores if no user is logged in
      userId.set(null);
      username.set(null);
      return false;
    }
  } catch (error) {
    // Handle network errors or other issues
    console.error("Error checking login status:", error);
    userId.set(null);
    username.set(null);
    return false;
  }
}

/**
 * Logs out the current user and clears authentication stores
 * Redirects to home page after successful logout
 * @async
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const data = await mutate(LOGOUT);

    if (data.logout) {
      userId.set(null);
      username.set(null);
      navigate("/", { replace: true });
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
}
