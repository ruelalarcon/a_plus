<script lang="ts">
    import { username } from '../lib/stores.js';
    import UserDropdown from "./UserDropdown.svelte";
</script>

<div class="header">
    <a class ="logo" href="/">
        CanvasButBetter
    </a>
    <div class="user-info">
        <p>Welcome, <strong>{$username}</strong></p>
        <nav>
            <UserDropdown></UserDropdown>
        </nav>
    </div>
</div>


<style>
    .header {
        z-index: 999;
        display: flex;
        position: fixed;
        justify-content: space-between;
        align-items: center;
        background-color: #000000;
        width: 100%;
        margin: 0 auto;
        padding: 10px;
    }

    .logo {
        display: flex;
        color: #839788;
        text-decoration: none;
        list-style: none;
        font-size: 1.25rem;
    }

    .logo:hover {
        display: flex;
        color: #96d5a6;
        text-decoration: none;
        list-style: none;
        font-size: 1.25rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        color: #839788;
        padding-right: 20px;
        gap: 10px;
    }
</style>