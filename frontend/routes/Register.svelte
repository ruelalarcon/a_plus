<script>
    import { navigate, Link } from 'svelte-routing';

    let password = '';
    let confirmPassword = '';
    let passwordError = '';

    function validatePasswords() {
        if (password !== confirmPassword) {
            passwordError = 'Passwords do not match';
            return false;
        }
        if (password.length < 6) {
            passwordError = 'Password must be at least 6 characters long';
            return false;
        }
        passwordError = '';
        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validatePasswords()) return;

        const formData = new FormData(e.target);
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: formData.get('username'),
                password: password,
            }),
        });

        if (response.ok) {
            navigate('/login', { replace: true });
        } else {
            alert('Registration failed');
        }
    }
</script>

<main class="register-page">
    <header>
        <h1>Register</h1>
    </header>

    <section class="register-form-container">
        <form on:submit={handleSubmit}>
            <div class="form-group">
                <label for="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Username"
                    required
                    autocomplete="username"
                />
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    placeholder="Password"
                    required
                    autocomplete="new-password"
                />
            </div>
            <div class="form-group">
                <label for="confirm-password">Confirm Password</label>
                <input
                    type="password"
                    id="confirm-password"
                    bind:value={confirmPassword}
                    placeholder="Confirm Password"
                    required
                    autocomplete="new-password"
                />
            </div>
            {#if passwordError}
                <div class="error">
                    {passwordError}
                </div>
            {/if}
            <div class="form-actions">
                <button type="submit">Register</button>
            </div>
        </form>
    </section>

    <footer class="register-footer">
        <p>
            Already have an account? <Link to="/login">Log in</Link>
        </p>
    </footer>
</main>

<style>
    .register-page {
        max-width: 400px;
        margin: 40px auto;
        padding: 20px;
    }

    .form-group {
        margin: 20px 0;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
    }

    .form-group input {
        width: 100%;
        padding: 8px;
        box-sizing: border-box;
    }

    .form-actions {
        margin-top: 20px;
    }

    .register-footer {
        margin-top: 20px;
        text-align: center;
    }

    .error {
        color: red;
        margin: 10px 0;
        padding: 10px;
        border: 1px solid red;
        border-radius: 4px;
        background-color: #fff5f5;
    }
</style>