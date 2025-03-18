<script>
    import { username, logout } from '../lib/stores.js';
    import Header from '../components/Header.svelte';
    import Sidebar from '../components/Sidebar.svelte';
    import CourseTracker from '../components/CourseTracker.svelte';
</script>

<main class="crstracker">
    <Header />
    <Sidebar />
    <div class="focus">
        <CourseTracker />
    </div>
</main>

<style>
    .focus {
        display: flex;
        flex-direction: column;
        gap: 40px;
        position: relative;
        padding-left: 220px;
        padding-top: 70px;
    }
</style>