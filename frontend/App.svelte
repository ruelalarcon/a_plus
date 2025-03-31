<script>
  // Import styles
  import "./app.css";

  // Import Svelte utilities
  import { Router, Route, navigate } from "svelte-routing";
  import { onMount } from "svelte";

  // Import custom utilities
  import { updateSessionState, userId } from "./lib/stores.js";

  // Import components
  import AppShell from "./components/AppShell.svelte";
  import CommentsModal from "./components/CommentsModal.svelte";
  import { Toaster } from "svelte-sonner";

  // Import routes
  import Login from "./routes/Login.svelte";
  import Register from "./routes/Register.svelte";
  import Index from "./routes/Index.svelte";
  import Calculators from "./routes/Calculators.svelte";
  import Courses from "./routes/Courses.svelte";
  import Calculator from "./routes/Calculator.svelte";
  import Search from "./routes/Search.svelte";
  import TemplatePreview from "./routes/TemplatePreview.svelte";
  import User from "./routes/User.svelte";

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

  // Get the base URL from the window location (for deployment in different environments)
  export let url = "";
</script>

<Toaster />
<CommentsModal />

<Router {url}>
  <main>
    {#if !isLoading}
      {#if $userId}
        <AppShell>
          <Route path="/" component={Calculators} />
          <Route path="/calculator/:id" let:params>
            <Calculator id={params.id} />
          </Route>
          <Route path="/courses" component={Courses} />
          <Route path="/user/:id" let:params>
            <User id={params.id} />
          </Route>
          <Route path="/search" component={Search} />
          <Route path="/template/:id" let:params>
            <TemplatePreview id={params.id} />
          </Route>
        </AppShell>
      {:else}
        <Route path="/" component={Index} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/template/:id" let:params>
          <TemplatePreview id={params.id} />
        </Route>
      {/if}
    {/if}
  </main>
</Router>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
</style>
