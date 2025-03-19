/**
 * Authentication API module
 * Provides functions for user authentication while maintaining the simple fetch-based approach
 */

/**
 * Log in a user with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Response>} The raw response from the server
 */
export async function login(username, password) {
    return fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}

/**
 * Register a new user
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Response>} The raw response from the server
 */
export async function register(username, password) {
    return fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
}

/**
 * Log out the current user
 * @returns {Promise<Response>} The raw response from the server
 */
export async function logout() {
    return fetch('/api/logout', {
        method: 'POST',
    });
}

/**
 * Get the current user's information
 * @returns {Promise<Response>} The raw response from the server
 */
export async function getUser() {
    return fetch('/api/user');
}