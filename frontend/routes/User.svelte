<script>
  import { onMount } from "svelte";
  import { query } from "../lib/graphql/client.js";
  import { USER_TEMPLATES, USER_COMMENTS } from "../lib/graphql/queries.js";
  import { toast } from "svelte-sonner";
  import TemplateCard from "../components/TemplateCard.svelte";
  import CommentCard from "../components/CommentCard.svelte";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";

  // Icons
  import MessageSquare from "lucide-svelte/icons/message-square";
  import User from "lucide-svelte/icons/user";
  import FileText from "lucide-svelte/icons/file-text";
  import Calendar from "lucide-svelte/icons/calendar";

  export let id; // User ID from route params

  let user = null;
  let templates = [];
  let comments = [];
  let activeTab = "templates";

  onMount(async () => {
    await Promise.all([loadUserTemplates(), loadUserComments()]);
  });

  async function loadUserTemplates() {
    try {
      const data = await query(USER_TEMPLATES, { id });
      user = data.user;
      templates = user?.templates || [];
    } catch (error) {
      console.error("Error loading user templates:", error);
      toast.error("Failed to load user templates");
    }
  }

  async function loadUserComments() {
    try {
      const data = await query(USER_COMMENTS, { userId: id });
      comments = data.user?.comments || [];
    } catch (error) {
      console.error("Error loading user comments:", error);
      toast.error("Failed to load user comments");
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function handleTemplateDelete(templateId) {
    templates = templates.filter((t) => t.id !== templateId);
  }

  // Computed latest activity
  $: latestActivity =
    [...templates, ...comments].sort(
      (a, b) =>
        new Date(b.created_at || b.updated_at) -
        new Date(a.created_at || a.updated_at)
    )[0]?.created_at || null;
</script>

<div class="bg-muted/40 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          {#if user}
            <h1
              class="text-3xl font-bold tracking-tight flex items-center gap-2"
            >
              <User class="h-8 w-8 text-primary" />
              {user.username}'s Profile
            </h1>
          {:else}
            <h1
              class="text-3xl font-bold tracking-tight flex items-center gap-2"
            >
              <User class="h-8 w-8 text-primary" />
              User Profile
            </h1>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Templates</p>
              <p class="text-2xl font-bold">{templates.length}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Comments</p>
              <p class="text-2xl font-bold">{comments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {#if latestActivity}
        <div class="mt-4 text-sm text-muted-foreground flex items-center gap-2">
          <Calendar class="h-4 w-4" />
          <span>Latest content created: {formatDate(latestActivity)}</span>
        </div>
      {/if}
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Sidebar -->
      <div class="md:col-span-1">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <User class="h-5 w-5" />
              User Info
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#if user}
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <div
                      class="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p class="font-medium">{user.username}</p>
                    </div>
                  </div>

                  <Separator class="my-4" />

                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p class="text-muted-foreground">Templates</p>
                      <p class="font-medium">{templates.length}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground">Comments</p>
                      <p class="font-medium">{comments.length}</p>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="text-center py-4">
                  <p class="text-muted-foreground">
                    Loading user information...
                  </p>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Main Content -->
      <div class="md:col-span-3">
        <Tabs.Root bind:value={activeTab} class="w-full">
          <Tabs.List class="w-full border-b mb-6">
            <Tabs.Trigger value="templates" class="flex items-center gap-1">
              <FileText class="h-4 w-4" />
              Templates
              <Badge variant="secondary" class="ml-1">{templates.length}</Badge>
            </Tabs.Trigger>
            <Tabs.Trigger value="comments" class="flex items-center gap-1">
              <MessageSquare class="h-4 w-4" />
              Comments
              <Badge variant="secondary" class="ml-1">{comments.length}</Badge>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="templates">
            {#if templates.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each templates as template}
                  <TemplateCard {template} onDelete={handleTemplateDelete} />
                {/each}
              </div>
            {:else}
              <div class="text-center py-10 bg-background rounded-lg border">
                <FileText
                  class="h-12 w-12 mx-auto text-muted-foreground mb-4"
                />
                <p class="text-muted-foreground">No published templates yet.</p>
              </div>
            {/if}
          </Tabs.Content>

          <Tabs.Content value="comments">
            {#if comments.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each comments as comment}
                  <CommentCard {comment} showTemplate={true} />
                {/each}
              </div>
            {:else}
              <div class="text-center py-10 bg-background rounded-lg border">
                <MessageSquare
                  class="h-12 w-12 mx-auto text-muted-foreground mb-4"
                />
                <p class="text-muted-foreground">No comments yet.</p>
              </div>
            {/if}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  </div>
</div>
