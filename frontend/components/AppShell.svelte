<script>
  import { Link, useLocation, navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet";

  // Icons
  import Menu from "lucide-svelte/icons/menu";
  import Calculator from "lucide-svelte/icons/calculator";
  import BookOpen from "lucide-svelte/icons/book-open";
  import User from "lucide-svelte/icons/user";
  import Search from "lucide-svelte/icons/search";
  import LogOut from "lucide-svelte/icons/log-out";

  import { username, userId, logout } from "../lib/stores.js";

  export let title = "Grade Calculator";

  let isMobile = false;
  let isSidebarOpen = false;

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
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="border-b bg-background sticky top-0 z-40">
    <div class="w-full px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-4">
        {#if isMobile}
          <Button
            variant="ghost"
            size="icon"
            on:click={() => (isSidebarOpen = !isSidebarOpen)}
          >
            <Menu class="h-5 w-5" />
          </Button>
        {/if}
        <h1 class="text-lg font-semibold">{title}</h1>
      </div>

      {#if $userId}
        <div class="text-sm text-muted-foreground">
          <span>Hi, <strong>{$username || "User"}</strong></span>
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
      >
        <Sheet.Content side="left" class="w-72 p-0">
          <div class="h-full flex flex-col">
            <div class="p-4 border-b">
              <h2 class="font-semibold">Navigation</h2>
            </div>

            <nav class="flex-1 overflow-auto">
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
                      >
                        <svelte:component this={icon} class="h-4 w-4" />
                        {label}
                      </Button>
                    {:else}
                      <Link to={pathValue} on:click={closeSidebar}>
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

            {#if $userId}
              <div class="p-4 border-t">
                <Button
                  variant="outline"
                  class="w-full flex items-center gap-2"
                  on:click={logout}
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
      >
        <nav class="h-full flex flex-col">
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
                  >
                    <svelte:component this={icon} class="h-4 w-4" />
                    {label}
                  </Button>
                {:else}
                  <Link to={pathValue}>
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
    <main class="flex-1 min-h-[calc(100vh-3.5rem)]">
      <slot />
    </main>
  </div>
</div>
