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
  import { mutate } from "../lib/graphql/client.js";
  import { REGISTER } from "../lib/graphql/mutations.js";

  let password = "";
  let confirmPassword = "";
  let passwordError = "";

  function validatePasswords() {
    if (password !== confirmPassword) {
      passwordError = "Passwords do not match";
      return false;
    }
    if (password.length < 6) {
      passwordError = "Password must be at least 6 characters long";
      return false;
    }
    passwordError = "";
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validatePasswords()) {
      toast.error("Password validation failed", {
        description: passwordError,
        action: {
          label: "Try Again",
          onClick: () => {
            password = "";
            confirmPassword = "";
          },
        },
      });
      return;
    }

    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const data = await mutate(REGISTER, {
        username,
        password,
      });

      if (data.register) {
        toast.success("Registration successful!", {
          description:
            "Your account has been created. Please log in to continue.",
          action: {
            label: "Log In",
            onClick: () => navigate("/login", { replace: true }),
          },
        });
        navigate("/login", { replace: true });
      } else {
        toast.error("Registration failed", {
          description: "Unable to register with the provided details.",
          action: {
            label: "Try Again",
            onClick: () => {
              e.target.reset();
              password = "";
              confirmPassword = "";
            },
          },
        });
      }
    } catch (error) {
      toast.error("Registration failed", {
        description:
          error.graphQLErrors?.[0]?.message ||
          "Unable to connect to the server. Please try again.",
        action: {
          label: "Try Again",
          onClick: () => {
            e.target.reset();
            password = "";
            confirmPassword = "";
          },
        },
      });
    }
  }
</script>

<Toaster />

<main class="register-page">
  <Card class="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Register</CardTitle>
      <CardDescription>Create a new account to get started</CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <Label for="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            placeholder="Choose a username"
            required
            autocomplete="username"
          />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            type="password"
            id="password"
            bind:value={password}
            placeholder="Create a password"
            required
            autocomplete="new-password"
          />
        </div>
        <div class="space-y-2">
          <Label for="confirm-password">Confirm Password</Label>
          <Input
            type="password"
            id="confirm-password"
            bind:value={confirmPassword}
            placeholder="Confirm your password"
            required
            autocomplete="new-password"
          />
        </div>
        <Button type="submit" class="w-full">Register</Button>
      </form>
    </CardContent>
    <CardFooter class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        Already have an account? <Link
          to="/login"
          class="text-primary hover:underline">Log in</Link
        >
      </p>
    </CardFooter>
  </Card>
</main>
