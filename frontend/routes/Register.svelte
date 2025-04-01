<script>
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { toast } from "svelte-sonner";
  import { navigate, Link } from "svelte-routing";
  import { mutate } from "../lib/graphql/client.js";
  import { REGISTER } from "../lib/graphql/mutations.js";
  import BackgroundArt from "$resources/bg-art.png";
  import { updateSessionState } from "../lib/stores.js";

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
        await updateSessionState();
        toast.success("Registration successful!", {
          description: "Your account has been created.",
        });
        navigate("/", { replace: true });
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

<div
  class="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden"
  data-test="register-page"
>
  <div class="flex items-center justify-center py-12">
    <div class="mx-auto grid w-[350px] gap-6">
      <div class="grid gap-2 text-center">
        <h1 class="text-3xl font-bold">Register</h1>
        <p class="text-muted-foreground text-balance">
          Create a new account to get started
        </p>
      </div>
      <form
        on:submit={handleSubmit}
        class="grid gap-4"
        data-test="register-form"
      >
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            placeholder="Choose a username"
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
            bind:value={password}
            placeholder="Create a password"
            required
            autocomplete="new-password"
            data-test="password-input"
          />
        </div>
        <div class="grid gap-2">
          <Label for="confirm-password">Confirm Password</Label>
          <Input
            type="password"
            id="confirm-password"
            bind:value={confirmPassword}
            placeholder="Confirm your password"
            required
            autocomplete="new-password"
            data-test="confirm-password-input"
          />
        </div>
        <Button type="submit" class="w-full" data-test="register-submit-btn"
          >Register</Button
        >
      </form>
      <div class="text-center text-sm">
        Already have an account?
        <Link to="/login" class="text-primary underline" data-test="login-link"
          >Log in</Link
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
