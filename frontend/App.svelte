<script>
	// Import Svelte utilities
	import { Router, Route } from 'svelte-routing';
	import { onMount } from 'svelte';

	// Import custom utilities
	import { checkLoginStatus, userId, username } from './lib/stores.js';

	// Import custom components
	import Login from './components/Login.svelte';
	import Register from './components/Register.svelte';
	import Home from './components/Home.svelte';
	import Dashboard from './components/Dashboard.svelte';
	import GradeCalculator from './components/GradeCalculator.svelte';
	import Search from './components/Search.svelte';

	// Check login status on mount
	onMount(checkLoginStatus);
</script>

<Router>
	<main>
		<Route path="/">
			{#if $userId}
				<Dashboard />
			{:else}
				<Home />
			{/if}
		</Route>
		<Route path="/login">
			<Login />
		</Route>
		<Route path="/register">
			<Register />
		</Route>
		<Route path="/calculator/:id" let:params>
			<GradeCalculator id={params.id} />
		</Route>
		<Route path="/search">
			<Search />
		</Route>
	</main>
</Router>
