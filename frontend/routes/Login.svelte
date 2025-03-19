<script>
    import { navigate, Link } from 'svelte-routing';
    import { checkLoginStatus } from '../lib/stores.js';
    import * as authApi from '../lib/api/auth.js';

    async function handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await authApi.login(
            formData.get('username'),
            formData.get('password')
        );

        if (response.ok) {
            await checkLoginStatus();
            // Check if there's a saved redirect path (e.g., from template preview)
            const redirectPath = localStorage.getItem('redirectAfterAuth');
            if (redirectPath) {
                localStorage.removeItem('redirectAfterAuth');
                navigate(redirectPath, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } else {
            alert('Login failed');
        }
    }
</script>

<main class="login-page">
    <header>
        <h1>Login</h1>
    </header>

    <section class="login-form-container">
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
                    name="password"
                    placeholder="Password"
                    required
                    autocomplete="current-password"
                />
            </div>
            <div class="form-actions">
                <button type="submit">Login</button>
            </div>
        </form>
    </section>

    <footer class="login-footer">
        <p>
            Don't have an account yet? <Link to="/register">Register</Link>
        </p>
    </footer>
</main>

<style>
    .login-page {
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

    .login-footer {
        margin-top: 20px;
        text-align: center;
    }
</style>