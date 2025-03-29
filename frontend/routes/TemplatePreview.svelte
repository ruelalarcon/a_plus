<script>
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import VoteButtons from "../components/VoteButtons.svelte";
  import Comments from "../components/Comments.svelte";
  import { query, mutate } from "../lib/graphql/client.js";
  import { TEMPLATE } from "../lib/graphql/queries.js";
  import { USE_TEMPLATE } from "../lib/graphql/mutations.js";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { toast, Toaster } from "svelte-sonner";

  export let id; // Template ID from route params

  let template = null;
  let showComments = false;

  onMount(async () => {
    await loadTemplate();
  });

  async function loadTemplate() {
    try {
      const data = await query(TEMPLATE, { id });
      template = data.template;
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  }

  async function useTemplate() {
    try {
      const data = await mutate(USE_TEMPLATE, { templateId: id });
      if (data.useTemplate) {
        navigate(`/calculator/${data.useTemplate.id}`);
      } else {
        toast.error("Failed to use template");
      }
    } catch (error) {
      console.error("Error using template:", error);
      toast.error("Failed to use template");
    }
  }
</script>

<Toaster />

<main class="container mx-auto px-4 py-8">
  {#if template}
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">{template.name}</h1>
      {#if template.institution}
        <p class="text-lg text-muted-foreground">
          {template.institution} - {template.term}
          {template.year}
        </p>
      {/if}
      {#if template.creator}
        <p class="text-sm text-muted-foreground">
          Created by {template.creator.username}
        </p>
      {/if}
    </header>

    <div class="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>Course assessments and their weights</CardDescription
          >
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              class="grid grid-cols-2 gap-4 font-medium text-sm text-muted-foreground"
            >
              <span>Assessment Name</span>
              <span>Weight (%)</span>
            </div>
            {#each template.assessments as assessment}
              <div class="grid grid-cols-2 gap-4 py-2">
                <span>{assessment.name}</span>
                <span>{assessment.weight}%</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex justify-between items-center">
            <VoteButtons
              voteCount={template.vote_count}
              userVote={template.user_vote}
              creatorId={template.creator.id}
              templateId={id}
            />

            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                on:click={() => (showComments = !showComments)}
              >
                {showComments ? "Hide" : "Show"} Comments
              </Button>
              <Button size="sm" on:click={useTemplate}>Use Template</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {#if showComments}
        <Comments templateId={id} />
      {/if}
    </div>
  {:else}
    <div class="text-center py-10">
      <p class="text-muted-foreground">Loading...</p>
    </div>
  {/if}
</main>
