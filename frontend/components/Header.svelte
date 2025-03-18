<script lang="ts">
    import { username } from '../lib/stores.js';
    import { Input } from "$lib/components/ui/input";
    import UserDropdown from "./UserDropdown.svelte";
</script>

<div class="header">
    <a class ="logo" href="/">
        CanvasButBetter
    </a>
    
    <Input type="search" placeholder="Search Templates..." class="max-w-xs" />

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
        background-color: rgb(211, 211, 211);
        width: 100%;
        margin: 0 auto;
        padding: 10px;
    }

    .logo {
        display: flex;
        color: rgb(48, 48, 48);
        text-decoration: none;
        list-style: none;
        font-size: 1.25rem;
    }

    .logo:hover {
        display: flex;
        color: black;
        text-decoration: none;
        list-style: none;
        font-size: 1.25rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        padding-right: 20px;
        gap: 10px;
    }
</style>