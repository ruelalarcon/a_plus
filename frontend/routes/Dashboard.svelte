<script>
  import { username, logout } from "../lib/stores.js";
  import CourseTracker from "../components/CourseTracker.svelte";
  import CalculatorList from "../components/CalculatorList.svelte";
  import TemplateList from "../components/TemplateList.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
</script>

<main class="container mx-auto px-4 py-8">
  <header
    class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Welcome back, <strong>{$username}</strong>
      </p>
    </div>
    <Button variant="outline" on:click={logout}>Logout</Button>
  </header>

  <div class="space-y-8">
    <section>
      <h2 class="text-2xl font-semibold tracking-tight mb-4">
        Grade Calculators
      </h2>
      <CalculatorList />
    </section>

    <Separator />

    <section>
      <h2 class="text-2xl font-semibold tracking-tight mb-4">
        Published Templates
      </h2>
      <TemplateList />
    </section>

    <Separator />

    <section>
      <h2 class="text-2xl font-semibold tracking-tight mb-4">Course Tracker</h2>
      <CourseTracker />
    </section>
  </div>
</main>
