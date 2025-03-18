<script>
	// Import Svelte utilities
	import { Router, Route, navigate } from 'svelte-routing';
	import { onMount } from 'svelte';

	// Import custom utilities
	import { checkLoginStatus, userId } from './lib/stores.js';

	// Import routes
	import Login from './routes/Login.svelte';
	import Register from './routes/Register.svelte';
	import Index from './routes/Index.svelte';
	import Dashboard from './routes/Dashboard.svelte';
	import GradeCalculator from './routes/GradeCalculator.svelte';
	import Search from './routes/Search.svelte';
	import TemplatePreview from './routes/TemplatePreview.svelte';
	import UserCalcs from "./routes/UserCalcs.svelte";
	import UserTemplates from "./routes/UserTemplates.svelte";
	import UserCourses from "./routes/UserCourses.svelte";

	let isLoading = true;

	// Check login status when app mounts and set loading state
	onMount(async () => {
		await checkLoginStatus();
		isLoading = false;
	});

	// Authentication redirect logic
	// Redirects unauthenticated users to login/register pages based on current path
	$: if (!isLoading && !$userId) {
		const path = window.location.pathname;
		// Special case: Redirect template preview to register to capture potential new users
		if (path.startsWith('/template/')) {
			localStorage.setItem('redirectAfterAuth', path);
			navigate('/register', { replace: true });
		} else if (path !== '/' && path !== '/login' && path !== '/register') {
			navigate('/login', { replace: true });
		}
	}

	// Prevent authenticated users from accessing auth pages
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
					<Index />
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
			<Route path="/template/:id" let:params>
				<TemplatePreview id={params.id} />
			</Route>
			<Route path="/my-templates">
				{#if $userId}
					<UserTemplates />
				{/if}
			</Route>
			<Route path="/my-course-tracker">
				{#if $userId}
					<UserCourses />
				{/if}
			</Route>
			<Route path="/my-calcs">
				{#if $userId}
					<UserCalcs />
				{/if}
			</Route>
		{/if}
	</main>
</Router>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	main {
		min-height: 100vh;
		background: #f5f5f5;
	}
</style>
