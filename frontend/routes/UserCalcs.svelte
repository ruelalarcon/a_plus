<script>
    import { username, logout } from '../lib/stores.js';
    import Header from '../components/Header.svelte';
    import Sidebar from '../components/Sidebar.svelte';
    import CalculatorList from '../components/CalculatorList.svelte';
</script>

<main class="usrcalc">
    <Header />
    <Sidebar />
    <div class="focus">
        <CalculatorList />
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