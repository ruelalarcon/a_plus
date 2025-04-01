<script>
  import { Link, useLocation, navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet";
  import CommandPalette from "./CommandPalette.svelte";
  import { Badge } from "$lib/components/ui/badge";

  // Icons
  import Logo from "$resources/logo.svg";
  import Menu from "lucide-svelte/icons/menu";
  import Calculator from "lucide-svelte/icons/calculator";
  import BookOpen from "lucide-svelte/icons/book-open";
  import User from "lucide-svelte/icons/user";
  import Search from "lucide-svelte/icons/search";
  import LogOut from "lucide-svelte/icons/log-out";
  import Command from "lucide-svelte/icons/command";

  import { username, userId, logout } from "../lib/stores.js";

  let isMobile = false;
  let isSidebarOpen = false;
  let commandPaletteOpen = false;

  // Get location from the router
  const location = useLocation();
  $: currentPath = $location.pathname;

  // Handle responsive behavior
  onMount(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  });

  function checkMobile() {
    isMobile = window.innerWidth < 768;
    if (!isMobile) {
      isSidebarOpen = true;
    } else {
      isSidebarOpen = false;
    }
  }

  function closeSidebar() {
    if (isMobile) {
      isSidebarOpen = false;
    }
  }

  // Handle profile navigation to ensure page refreshes
  function handleProfileClick(e) {
    e.preventDefault();
    closeSidebar();
    const profilePath = `/user/${$userId}`;

    // Only force navigation when on a different user profile
    if (currentPath.startsWith("/user/") && currentPath !== profilePath) {
      navigate(profilePath);
      // Force page reload to ensure content updates
      setTimeout(() => window.location.reload(), 0);
    } else {
      navigate(profilePath);
    }
  }

  const navItems = [
    { path: "/", label: "My Calculators", icon: Calculator },
    { path: "/courses", label: "My Courses", icon: BookOpen },
    {
      path: () => `/user/${$userId}`,
      label: "My Profile",
      icon: User,
      onClick: handleProfileClick,
    },
    { path: "/search", label: "Search Templates", icon: Search },
  ];

  function isActive(path) {
    const pathToCheck = typeof path === "function" ? path() : path;

    if (pathToCheck === "/") {
      return currentPath === "/";
    } else if (pathToCheck === "/courses") {
      return currentPath.startsWith("/courses");
    } else if (pathToCheck === "/search") {
      return currentPath.startsWith("/search");
    } else if (pathToCheck.startsWith("/user/")) {
      return currentPath === `/user/${$userId}`;
    }

    return currentPath.startsWith(pathToCheck);
  }

  function openCommandPalette() {
    commandPaletteOpen = true;
  }
</script>

<CommandPalette bind:open={commandPaletteOpen} />

<div class="min-h-screen flex flex-col" data-test="app-shell">
  <!-- Header -->
  <header
    class="border-b bg-background sticky top-0 z-40"
    data-test="app-header"
  >
    <div class="w-full px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-4">
        {#if isMobile}
          <Button
            variant="ghost"
            size="icon"
            on:click={() => (isSidebarOpen = !isSidebarOpen)}
            data-test="mobile-menu-btn"
          >
            <Menu class="h-5 w-5" />
          </Button>
        {/if}
        <Link to="/" class="flex items-center" data-test="app-logo">
          <div class="h-8 flex items-center">
            <img
              src={Logo}
              alt="A+Plus"
              class="h-full w-auto"
              style="filter: invert(28%) sepia(66%) saturate(359%) hue-rotate(88deg) brightness(92%) contrast(86%);"
            />
          </div>
        </Link>
      </div>

      {#if $userId}
        <div class="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            on:click={openCommandPalette}
            class="hidden md:flex items-center gap-2"
            data-test="command-palette-btn"
          >
            <Command class="h-4 w-4" />
            <span>Command Palette</span>
            <div class="flex flex-col items-start ml-1">
              <Badge variant="outline" class="py-0">Ctrl+K</Badge>
            </div>
          </Button>
          <div class="text-sm text-muted-foreground" data-test="user-greeting">
            <span>Hi, <strong>{$username || "User"}</strong></span>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <div class="flex-1 flex">
    <!-- Mobile Sidebar (Sheet) -->
    {#if isMobile}
      <Sheet.Root
        open={isSidebarOpen}
        onOpenChange={(open) => (isSidebarOpen = open)}
        data-test="mobile-sidebar"
      >
        <Sheet.Content side="left" class="w-72 p-0">
          <div class="h-full flex flex-col">
            <div class="p-4 border-b">
              <h2 class="font-semibold">Navigation</h2>
            </div>

            <nav class="flex-1 overflow-auto" data-test="mobile-nav">
              <ul class="p-2 space-y-1">
                {#each navItems as { path, label, icon, onClick }, i (currentPath + i)}
                  {@const pathValue =
                    typeof path === "function" ? path() : path}
                  {@const active = isActive(path)}
                  <li>
                    {#if onClick}
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        class="w-full justify-start gap-3"
                        on:click={onClick}
                        data-test={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <svelte:component this={icon} class="h-4 w-4" />
                        {label}
                      </Button>
                    {:else}
                      <Link
                        to={pathValue}
                        on:click={closeSidebar}
                        data-test={`nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Button
                          variant={active ? "secondary" : "ghost"}
                          class="w-full justify-start gap-3"
                        >
                          <svelte:component this={icon} class="h-4 w-4" />
                          {label}
                        </Button>
                      </Link>
                    {/if}
                  </li>
                {/each}
              </ul>
            </nav>

            <!-- Remove Command Palette from mobile sidebar -->
            <div class="p-2 border-t hidden">
              <Button
                variant="outline"
                class="w-full justify-start gap-3"
                on:click={openCommandPalette}
              >
                <Command class="h-4 w-4" />
                <div class="flex flex-col items-start">
                  <span>Command Palette (Ctrl+K)</span>
                  <span class="text-xs text-muted-foreground"
                    >+ Alt+C/O/A/S</span
                  >
                </div>
              </Button>
            </div>

            {#if $userId}
              <div class="p-4 border-t">
                <Button
                  variant="outline"
                  class="w-full flex items-center gap-2"
                  on:click={logout}
                  data-test="logout-btn-mobile"
                >
                  <LogOut class="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            {/if}
          </div>
        </Sheet.Content>
      </Sheet.Root>
    {/if}

    <!-- Desktop Sidebar -->
    {#if !isMobile && isSidebarOpen}
      <aside
        class="w-64 border-r bg-background h-[calc(100vh-3.5rem)] sticky top-14"
        data-test="desktop-sidebar"
      >
        <nav class="h-full flex flex-col" data-test="desktop-nav">
          <ul class="flex-1 p-4 space-y-2">
            {#each navItems as { path, label, icon, onClick }, i (currentPath + i)}
              {@const pathValue = typeof path === "function" ? path() : path}
              {@const active = isActive(path)}
              <li>
                {#if onClick}
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    class="w-full justify-start gap-3"
                    on:click={onClick}
                    data-test={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <svelte:component this={icon} class="h-4 w-4" />
                    {label}
                  </Button>
                {:else}
                  <Link
                    to={pathValue}
                    data-test={`nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      class="w-full justify-start gap-3"
                    >
                      <svelte:component this={icon} class="h-4 w-4" />
                      {label}
                    </Button>
                  </Link>
                {/if}
              </li>
            {/each}
          </ul>

          {#if $userId}
            <div class="p-4 border-t">
              <Button
                variant="outline"
                class="w-full flex items-center gap-2"
                on:click={logout}
                data-test="logout-btn"
              >
                <LogOut class="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          {/if}
        </nav>
      </aside>
    {/if}

    <!-- Main Content -->
    <main class="flex-1 min-h-[calc(100vh-3.5rem)]" data-test="main-content">
      <slot />
    </main>
  </div>
</div>
