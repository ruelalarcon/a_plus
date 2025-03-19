/**
 * @module stores
 * Authentication state management module using Svelte stores
 */

import { writable } from 'svelte/store';
import { navigate } from 'svelte-routing';
import * as authApi from './api/auth.js';

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
 * Checks the current user's login status by making an API call
 * Updates userId and username stores based on the response
 * @async
 * @returns {Promise<void>}
 */
export async function checkLoginStatus() {
	const response = await authApi.getUser();
	if (response.ok) {
		const data = await response.json();
		userId.set(data.userId);
		username.set(data.username);
	} else {
		userId.set(null);
		username.set(null);
	}
}

/**
 * Logs out the current user and clears authentication stores
 * Redirects to home page after successful logout
 * @async
 * @returns {Promise<void>}
 */
export async function logout() {
	const response = await authApi.logout();
	if (response.ok) {
		userId.set(null);
		username.set(null);
		navigate('/', { replace: true });
	}
}

// Initialize auth state on module load
checkLoginStatus();