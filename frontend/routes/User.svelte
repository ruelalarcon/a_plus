<script>
  import { onMount } from "svelte";
  import VoteButtons from "../components/VoteButtons.svelte";
  import Comments from "../components/Comments.svelte";
  import { query } from "../lib/graphql/client.js";
  import { USER_TEMPLATES, USER_COMMENTS } from "../lib/graphql/queries.js";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Toaster, toast } from "svelte-sonner";

  export let id; // User ID from route params

  let user = null;
  let templates = [];
  let comments = [];
  let activeComments = null;

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

  function toggleComments(templateId) {
    activeComments = activeComments === templateId ? null : templateId;
  }

  function copyShareLink(templateId) {
    const url = `${window.location.origin}/template/${templateId}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<main class="container mx-auto px-4 py-8">
  <Toaster />

  <header class="mb-8">
    {#if user}
      <h1 class="text-3xl font-bold tracking-tight">
        {user.username}'s Profile
      </h1>
    {:else}
      <h1 class="text-3xl font-bold tracking-tight">User Profile</h1>
    {/if}
  </header>

  <div class="space-y-8">
    <section>
      <h2 class="text-2xl font-semibold tracking-tight mb-4">Templates</h2>

      {#if templates.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each templates as template}
            <div>
              <Card class="w-full">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>
                    <p>
                      {template.institution} - {template.term}
                      {template.year}
                    </p>
                    <p>Created by {template.creator?.username}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="flex justify-between items-center mb-3">
                    <VoteButtons
                      voteCount={template.vote_count}
                      userVote={template.user_vote}
                      creatorId={template.creator?.id}
                      templateId={template.id}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      on:click={() => copyShareLink(template.id)}
                    >
                      Share URL
                    </Button>
                  </div>

                  <div class="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      on:click={() => toggleComments(template.id)}
                    >
                      {activeComments === template.id ? "Hide" : "Show"} Comments
                    </Button>
                  </div>
                </CardContent>
                {#if activeComments === template.id}
                  <CardFooter>
                    <Comments templateId={template.id} />
                  </CardFooter>
                {/if}
              </Card>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-10">
          <p class="text-muted-foreground">No published templates yet.</p>
        </div>
      {/if}
    </section>

    <section>
      <h2 class="text-2xl font-semibold tracking-tight mb-4">Comments</h2>

      {#if comments.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each comments as comment}
            <Card class="w-full">
              <CardHeader>
                <CardTitle class="text-base"
                  >Comment on <a
                    href={`/template/${comment.template.id}`}
                    class="text-primary hover:underline"
                    >{comment.template.name}</a
                  ></CardTitle
                >
                <CardDescription>
                  <p>{formatDate(comment.created_at)}</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p class="whitespace-pre-wrap">{comment.content}</p>
              </CardContent>
            </Card>
          {/each}
        </div>
      {:else}
        <div class="text-center py-10">
          <p class="text-muted-foreground">No comments yet.</p>
        </div>
      {/if}
    </section>
  </div>
</main>
