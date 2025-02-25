<script>
	// Import Svelte utilities
	import { Router, Route } from "svelte-routing";
	import { onMount } from "svelte";

	// Import custom utilities
	import { checkLoginStatus } from "./lib/stores.js";

	// Import custom components
	import Login from "./components/Login.svelte";
	import Register from "./components/Register.svelte";
	import Home from "./components/Home.svelte";

	// Check login status on mount
	onMount(checkLoginStatus);
</script>

<Router>
	<main>
		<Route path="/">
			<Home />

		</Route>
		<Route path="/login">
			<Login />
		</Route>
		<Route path="/register">
			<Register />
		</Route>
	</main>
</Router>
