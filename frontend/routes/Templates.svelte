<script>
  import { username, logout } from "../lib/stores.js";
  import VoteButtons from "../components/VoteButtons.svelte";
  import Comments from "../components/Comments.svelte";
  import { onMount } from "svelte";
  import { query, mutate } from "../lib/graphql/client.js";
  import { MY_TEMPLATES } from "../lib/graphql/queries.js";
  import { DELETE_TEMPLATE } from "../lib/graphql/mutations.js";
  import { userId } from "../lib/stores.js";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Toaster, toast } from "svelte-sonner";

  let templates = [];
  let activeComments = null;

  onMount(async () => {
    await loadTemplates();
  });

  async function loadTemplates() {
    try {
      const data = await query(MY_TEMPLATES);
      templates = data.myTemplates || [];
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    }
  }

  async function deleteTemplate(id, name) {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? The template will be hidden from search but existing copies will remain.`
      )
    ) {
      return;
    }

    try {
      const data = await mutate(DELETE_TEMPLATE, { id });
      if (data.deleteTemplate) {
        templates = templates.filter((t) => t.id !== id);
        toast.success("Template deleted successfully");
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
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
</script>

<main class="container mx-auto px-4 py-8">
  <header
    class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight">My Published Templates</h1>
      <p class="text-muted-foreground">
        Welcome back, <strong>{$username}</strong>
      </p>
    </div>
    <Button variant="outline" on:click={logout}>Logout</Button>
  </header>

  <div class="space-y-8">
    <section class="space-y-6">
      {#if templates.length > 0}
        <Toaster />
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
                      creatorId={$userId}
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

                  <div class="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      on:click={() => toggleComments(template.id)}
                    >
                      {activeComments === template.id ? "Hide" : "Show"} Comments
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      on:click={() =>
                        deleteTemplate(template.id, template.name)}
                    >
                      Delete
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
  </div>
</main>
