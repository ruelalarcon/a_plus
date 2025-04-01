<script>
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { toast } from "svelte-sonner";
  import { navigate, Link } from "svelte-routing";
  import { updateSessionState } from "../lib/stores.js";
  import { mutate } from "../lib/graphql/client.js";
  import { LOGIN } from "../lib/graphql/mutations.js";
  import BackgroundArt from "$resources/bg-art.png";

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

<div
  class="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden"
  data-test="login-page"
>
  <div class="flex items-center justify-center py-12">
    <div class="mx-auto grid w-[350px] gap-6">
      <div class="grid gap-2 text-center">
        <h1 class="text-3xl font-bold">Login</h1>
        <p class="text-muted-foreground text-balance">
          Enter your credentials to access your account
        </p>
      </div>
      <form on:submit={handleSubmit} class="grid gap-4" data-test="login-form">
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            placeholder="Enter your username"
            required
            autocomplete="username"
            data-test="username-input"
          />
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
            data-test="password-input"
          />
        </div>
        <Button type="submit" class="w-full" data-test="login-submit-btn"
          >Login</Button
        >
      </form>
      <div class="text-center text-sm">
        Don't have an account yet?
        <Link
          to="/register"
          class="text-primary underline"
          data-test="register-link">Register</Link
        >
      </div>
    </div>
  </div>
  <div class="bg-muted hidden lg:block">
    <img
      src={BackgroundArt}
      alt="placeholder"
      class="w-full h-screen object-cover dark:brightness-[0.2] dark:grayscale"
    />
  </div>
</div>
