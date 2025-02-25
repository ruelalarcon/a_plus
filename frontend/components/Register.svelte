<div class="container">
	<h1>Register</h1>
	<form on:submit={handleSubmit}>
		<input type="text" name="username" placeholder="Username" required />
		<input 	type="password" name="password" placeholder="Password" required />
		<button type="submit">Register</button>
	</form>
</div>

<script>
	import { navigate } from "svelte-routing";

	async function handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const response = await fetch("/api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: formData.get("username"),
				password: formData.get("password"),
			}),
		});

		if (response.ok) {
			navigate("/login", { replace: true });
		} else {
			alert("Registration failed");
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
