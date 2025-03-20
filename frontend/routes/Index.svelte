<script>
    import { Link } from 'svelte-routing';
</script>

<main class="container">
    <header>
        <h1>Welcome to Grade Tracker</h1>
    </header>
    <section id="userSection">
        <article id="loggedOutContent">
            <p>Track your grades, manage courses, and share templates with other students.</p>
            <nav class="actions">
                <Link to="/login" class="button">Login</Link>
                <Link to="/register" class="button">Register</Link>
            </nav>
        </article>
    </section>
</main>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
    }

    #userSection {
        margin-top: 40px;
    }

    .actions {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 20px;
    }
</style>