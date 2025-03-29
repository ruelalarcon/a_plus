<script>
  import { username, logout } from "../lib/stores.js";
  import CourseTracker from "../components/CourseTracker.svelte";
  import { Button } from "$lib/components/ui/button";
</script>

<main class="container mx-auto px-4 py-8">
  <header
    class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight">My Courses</h1>
      <p class="text-muted-foreground">
        Welcome back, <strong>{$username}</strong>
      </p>
    </div>
    <Button variant="outline" on:click={logout}>Logout</Button>
  </header>

  <div class="space-y-8">
    <CourseTracker />
  </div>
</main>
