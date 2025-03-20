<script>
  import Avatar from "./Avatar.svelte"; // Import the Avatar component
  import { logout } from '../lib/stores.js';
  let open = false;

  function toggleDropdown() {
    open = !open;
  }
</script>

<div class="dropdown">
  <button class="circle-btn" on:click={toggleDropdown}>
    <Avatar alt="User Profile" />
  </button>
  {#if open}
    <ul class="menu">
      <li>My Profile</li>
      <li>Settings</li>
      <li><a href={logout}>Logout</a></li>
    </ul>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
    display: inline-block;
  }

  .circle-btn {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .menu {
    position: absolute;
    top: 50px;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    list-style: none;
    padding: 10px;
    min-width: 120px;
  }

  .menu li {
    text-decoration: none;
    padding: 8px;
    
  }

  .menu li:hover {
    background: rgb(187, 185, 185); 
  }
  
</style>
