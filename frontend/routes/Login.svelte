<script>
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { toast, Toaster } from "svelte-sonner";
  import { navigate, Link } from "svelte-routing";
  import { updateSessionState } from "../lib/stores.js";
  import { mutate } from "../lib/graphql/client.js";
  import { LOGIN } from "../lib/graphql/mutations.js";

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const data = await mutate(LOGIN, { username, password });

      if (data.login) {
        await updateSessionState();
        const redirectPath = localStorage.getItem("redirectAfterAuth");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterAuth");
          navigate(redirectPath, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        toast.error("Login failed", {
          description: "Invalid username or password",
          action: {
            label: "Try Again",
            onClick: () => e.target.reset(),
          },
        });
      }
    } catch (error) {
      toast.error("Login failed", {
        description:
          error.graphQLErrors?.[0]?.message ||
          "Unable to connect to the server. Please try again.",
        action: {
          label: "Try Again",
          onClick: () => e.target.reset(),
        },
      });
    }
  }
</script>

<Toaster />

<main class="login-page">
  <Card class="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription
        >Enter your credentials to access your account</CardDescription
      >
    </CardHeader>
    <CardContent>
      <form on:submit={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <Label for="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            placeholder="Enter your username"
            required
            autocomplete="username"
          />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
          />
        </div>
        <Button type="submit" class="w-full">Login</Button>
      </form>
    </CardContent>
    <CardFooter class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        Don't have an account yet? <Link
          to="/register"
          class="text-primary hover:underline">Register</Link
        >
      </p>
    </CardFooter>
  </Card>
</main>
