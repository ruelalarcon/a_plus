<script>
	// Import Svelte utilities
	import { Router, Route, navigate } from 'svelte-routing';
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

	let isLoading = true;

	onMount(async () => {
		await checkLoginStatus(); // Sets the userId and username
		isLoading = false;
	});

	// Disallow authenticated users from accessing login/register
	$: if (!isLoading && !$userId) {
		const path = window.location.pathname;
		if (path !== '/' && path !== '/login' && path !== '/register') {
			navigate('/login', { replace: true });
		}
	}

	// Disallow unauthenticated users from accessing other pages
	$: if (!isLoading && $userId) {
		const path = window.location.pathname;
		if (path === '/login' || path === '/register') {
			navigate('/', { replace: true });
		}
	}
</script>

<Router>
	<main>
		{#if !isLoading}
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
				{#if $userId}
					<GradeCalculator id={params.id} />
				{/if}
			</Route>
			<Route path="/search">
				{#if $userId}
					<Search />
				{/if}
			</Route>
		{/if}
	</main>
</Router>
