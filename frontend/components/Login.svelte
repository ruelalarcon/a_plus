<div class="container">
	<h1>Login</h1>
	<form on:submit={handleSubmit}>
		<input type="text" name="username" placeholder="Username" required />
		<input type="password" name="password" placeholder="Password" required />
		<button type="submit">Login</button>
	</form>
</div>

<script>
	import { navigate } from "svelte-routing";
	import { checkLoginStatus } from "../lib/stores.js";

	async function handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const response = await fetch("/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: formData.get("username"),
				password: formData.get("password"),
			}),
		});

		if (response.ok) {
			await checkLoginStatus(); // Update the store
			navigate("/", { replace: true });
		} else {
			alert("Login failed");
		}
	}
</script>


<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 300px;
	}
</style>
