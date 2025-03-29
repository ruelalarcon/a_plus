<script>
  // Import styles
  import "./app.css";

  // Import Svelte utilities
  import { Router, Route, navigate } from "svelte-routing";
  import { onMount } from "svelte";

  // Import custom utilities
  import { updateSessionState, userId } from "./lib/stores.js";

  // Import routes
  import Login from "./routes/Login.svelte";
  import Register from "./routes/Register.svelte";
  import Index from "./routes/Index.svelte";
  import Calculators from "./routes/Calculators.svelte";
  import Courses from "./routes/Courses.svelte";
  import Templates from "./routes/Templates.svelte";
  import Calculator from "./routes/Calculator.svelte";
  import Search from "./routes/Search.svelte";
  import TemplatePreview from "./routes/TemplatePreview.svelte";

  let isLoading = true;

  // Check login status when app mounts and set loading state
  onMount(async () => {
    // Always check login status on mount, regardless of route
    await updateSessionState();
    isLoading = false;
  });

  // Authentication redirect logic
  // Redirects unauthenticated users to login/register pages based on current path
  $: if (!isLoading && !$userId) {
    const path = window.location.pathname;
    // Special case: Redirect template preview to register to capture potential new users
    if (path.startsWith("/template/")) {
      localStorage.setItem("redirectAfterAuth", path);
      navigate("/register", { replace: true });
    } else if (path !== "/" && path !== "/login" && path !== "/register") {
      navigate("/login", { replace: true });
    }
  }

  // Prevent authenticated users from accessing auth pages
  $: if (!isLoading && $userId) {
    const path = window.location.pathname;
    if (path === "/login" || path === "/register") {
      navigate("/", { replace: true });
    }
  }
</script>

<Router>
  <main>
    {#if !isLoading}
      <Route path="/">
        {#if $userId}
          <Calculators />
        {:else}
          <Index />
        {/if}
      </Route>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/register">
        <Register />
      </Route>
      <Route path="/courses">
        {#if $userId}
          <Courses />
        {/if}
      </Route>
      <Route path="/templates">
        {#if $userId}
          <Templates />
        {/if}
      </Route>
      <Route path="/calculator/:id" let:params>
        {#if $userId}
          <Calculator id={params.id} />
        {/if}
      </Route>
      <Route path="/search">
        {#if $userId}
          <Search />
        {/if}
      </Route>
      <Route path="/template/:id" let:params>
        <TemplatePreview id={params.id} />
      </Route>
    {/if}
  </main>
</Router>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
