import { writable } from 'svelte/store';
import { navigate } from 'svelte-routing';

export const userId = writable(null);
export const username = writable(null);

export async function checkLoginStatus() {
	try {
		const response = await fetch('/api/user');
		if (response.ok) {
			const data = await response.json();
			userId.set(data.userId);
			username.set(data.username);
		} else {
			userId.set(null);
			username.set(null);
		}
	} catch (error) {
		console.error('Error checking login status:', error);
		userId.set(null);
		username.set(null);
	}
}

export async function logout() {
	const response = await fetch('/api/logout', { method: 'POST' });
	if (response.ok) {
		userId.set(null);
		username.set(null);
		navigate('/', { replace: true });
	}
}