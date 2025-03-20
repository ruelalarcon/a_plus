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
      <li>><button>My Profile</button></li>
      <li><button>Settings</button></li>
      <li><button on:click={logout}>Logout</button></li>
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

  .menu button {
    width: 100%;
    padding: 10px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
  }

  .menu button:hover {
    background: #e0e0e0; /* Grey hover effect */
  }
  
</style>
