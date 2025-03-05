<script>
    import { username, logout } from '../lib/stores.js';
    import CourseTracker from '../components/CourseTracker.svelte';
    import CalculatorList from '../components/CalculatorList.svelte';
    import TemplateList from '../components/TemplateList.svelte';
</script>

<main class="container">
    <header class="page-header">
        <h1>Dashboard</h1>
        <div class="user-info">
            <p>Welcome, <strong>{$username}</strong></p>
            <nav>
                <button on:click={logout}>
                    Logout
                </button>
            </nav>
        </div>
    </header>

    <div class="dashboard-content">
        <CalculatorList />
        <TemplateList />
        <CourseTracker />
    </div>
</main>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40px;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .dashboard-content {
        display: flex;
        flex-direction: column;
        gap: 40px;
    }
</style>