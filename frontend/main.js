import App from './App.svelte';
import { Router } from "svelte-routing";

// Get the base URL for routing
const base = '';

const app = new App({
	target: document.body,
	props: {
		url: window.location.pathname
	}
});

export default app;