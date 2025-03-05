<div class="container">
	<h1>Welcome</h1>
	<div id="userSection">
		{#if $userId}
			<div id="loggedInContent">
				<p>Logged in as <span>{$username}</span></p>
				<button on:click={logout}>Logout</button>
			</div>
		{:else}
			<div id="loggedOutContent">
				<Link to="/login">Login</Link>
				<Link to="/register">Register</Link>
			</div>
		{/if}
	</div>
</div>

<script>
	import { Link } from 'svelte-routing';
	import { userId, username, logout } from '../lib/stores.js';
</script>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}
</style>