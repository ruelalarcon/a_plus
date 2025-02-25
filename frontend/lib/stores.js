import { writable } from 'svelte/store';
import { navigate } from 'svelte-routing';

export const username = writable(null);

export async function checkLoginStatus() {
	try {
		const response = await fetch('/api/user');
		if (response.ok) {
			const data = await response.json();
			username.set(data.username);
		} else {
			username.set(null);
		}
	} catch (error) {
		console.error('Error checking login status:', error);
		username.set(null);
	}
}

export async function logout() {
	const response = await fetch("/api/logout", { method: "POST" });
	if (response.ok) {
		username.set(null);
		navigate("/", { replace: true });
	}
}