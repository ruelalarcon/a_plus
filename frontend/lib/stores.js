import { writable } from 'svelte/store';
import { navigate } from 'svelte-routing';
import * as authApi from './api/auth.js';

// Create stores
export const userId = writable(null);
export const username = writable(null);

// Check login status
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

// Logout
export async function logout() {
	const response = await authApi.logout();
	if (response.ok) {
		userId.set(null);
		username.set(null);
		navigate('/', { replace: true });
	}
}

// Initialize auth state
checkLoginStatus();