<script>
  import { Link } from "svelte-routing";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
</script>

<main class="container mx-auto px-4 py-8">
  <div class="max-w-2xl mx-auto text-center space-y-8">
    <header class="space-y-4">
      <h1 class="text-4xl font-bold tracking-tight">
        Welcome to Grade Tracker
      </h1>
      <p class="text-xl text-muted-foreground">
        Track your grades, manage courses, and share templates with other
        students.
      </p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription
          >Create an account or log in to begin tracking your grades</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</main>
