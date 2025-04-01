<script>
  import { onMount } from "svelte";
  import { Link, navigate } from "svelte-routing";
  import VoteButtons from "../components/VoteButtons.svelte";
  import { openCommentsSheet } from "../components/CommentsSheet.svelte";
  import { query, mutate } from "../lib/graphql/client.js";
  import { TEMPLATE } from "../lib/graphql/queries.js";
  import { USE_TEMPLATE } from "../lib/graphql/mutations.js";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Table from "$lib/components/ui/table";
  import { Badge } from "$lib/components/ui/badge";
  import { toast } from "svelte-sonner";

  // Icons
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import BookOpen from "lucide-svelte/icons/book-open";
  import FileText from "lucide-svelte/icons/file-text";
  import MessageSquare from "lucide-svelte/icons/message-square";
  import Calendar from "lucide-svelte/icons/calendar";
  import User from "lucide-svelte/icons/user";
  import Building2 from "lucide-svelte/icons/building-2";
  import Copy from "lucide-svelte/icons/copy";
  import Check from "lucide-svelte/icons/check";

  export let id; // Template ID from route params

  let template = null;
  let loading = true;
  let copiedToClipboard = false;

  onMount(async () => {
    await loadTemplate();
  });

  async function loadTemplate() {
    loading = true;
    try {
      const data = await query(TEMPLATE, { id });
      template = data.template;
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    } finally {
      loading = false;
    }
  }

  async function useTemplate() {
    try {
      const data = await mutate(USE_TEMPLATE, { templateId: id });
      if (data.useTemplate) {
        toast.success("Template applied successfully");
        navigate(`/calculator/${data.useTemplate.id}`);
      } else {
        toast.error("Failed to use template");
      }
    } catch (error) {
      console.error("Error using template:", error);
      toast.error("Failed to use template");
    }
  }

  function copyTemplateLink() {
    const url = `${window.location.origin}/template/${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        copiedToClipboard = true;
        setTimeout(() => (copiedToClipboard = false), 2000);
      })
      .catch(() => toast.error("Failed to copy link"));
  }

  // Calculate total weight
  $: totalWeight =
    template?.assessments?.reduce(
      (sum, a) => sum + (parseFloat(a.weight) || 0),
      0
    ) || 0;

  // Format date if available
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="bg-muted/40 min-h-screen pb-8" data-test="template-preview-page">
  <div class="container mx-auto px-4 py-8">
    {#if loading}
      <div
        class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        data-test="template-loading"
      ></div>
    {:else if template}
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main content - 2/3 width on desktop -->
        <div class="md:col-span-2 space-y-6" data-test="template-main-content">
          <Card.Root>
            <Card.Header class="flex flex-row items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center">
                  <Link to="/search" data-test="back-to-search-link">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="mr-2 rounded-full h-8 w-8"
                      data-test="back-btn"
                    >
                      <ChevronLeft class="h-4 w-4" />
                    </Button>
                  </Link>
                  <Card.Title
                    class="text-2xl font-bold group flex items-center gap-2"
                    data-test="template-title"
                  >
                    {template.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 rounded-full transition-all opacity-50 hover:opacity-100"
                      on:click={copyTemplateLink}
                      data-test="copy-template-link-btn"
                    >
                      {#if copiedToClipboard}
                        <Check class="h-3.5 w-3.5 text-green-500" />
                      {:else}
                        <Copy class="h-3.5 w-3.5" />
                      {/if}
                    </Button>
                  </Card.Title>
                </div>
                <Card.Description>
                  {#if template.term || template.year}
                    <div
                      class="flex items-center gap-1 text-sm"
                      data-test="template-term-year"
                    >
                      <Calendar class="h-3.5 w-3.5 mr-0.5" />
                      <span>{template.term} {template.year}</span>
                    </div>
                  {/if}
                  {#if template.institution}
                    <div
                      class="flex items-center gap-1 text-sm mt-1"
                      data-test="template-institution"
                    >
                      <Building2 class="h-3.5 w-3.5 mr-0.5" />
                      <span>{template.institution}</span>
                    </div>
                  {/if}
                </Card.Description>
              </div>

              <div class="mt-1">
                <Badge
                  variant="outline"
                  class="flex items-center gap-1"
                  data-test="template-author-badge"
                >
                  <User class="h-3 w-3" />
                  {template.creator?.username || "Unknown"}
                </Badge>
              </div>
            </Card.Header>

            <Card.Content>
              <div class="rounded-md border" data-test="assessments-table">
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head class="w-[60%]">Assessment</Table.Head>
                      <Table.Head class="text-right">Weight (%)</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each template.assessments as assessment}
                      <Table.Row
                        data-test="assessment-row"
                        data-assessment-id={assessment.id}
                      >
                        <Table.Cell
                          class="font-medium"
                          data-test="assessment-name"
                        >
                          {assessment.name}
                        </Table.Cell>
                        <Table.Cell
                          class="text-right"
                          data-test="assessment-weight"
                        >
                          {assessment.weight}%
                        </Table.Cell>
                      </Table.Row>
                    {/each}

                    <Table.Row
                      class="border-t border-t-muted-foreground/20"
                      data-test="total-weight-row"
                    >
                      <Table.Cell class="font-bold">Total</Table.Cell>
                      <Table.Cell
                        class="text-right font-bold"
                        data-test="total-weight"
                      >
                        {totalWeight.toFixed(1)}%
                        {#if Math.abs(totalWeight - 100) > 0.1}
                          <Badge
                            variant="outline"
                            class="ml-2 border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400"
                            data-test="weight-warning"
                          >
                            {totalWeight < 100 ? "Under 100%" : "Over 100%"}
                          </Badge>
                        {/if}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </div>
            </Card.Content>

            <Card.Footer class="flex justify-end space-x-2">
              <Button
                variant="outline"
                class="flex items-center gap-1"
                on:click={() => openCommentsSheet(id)}
                data-test="view-comments-btn"
              >
                <MessageSquare class="h-4 w-4" />
                <span>View Comments</span>
              </Button>
              <Button
                class="flex items-center gap-1"
                on:click={useTemplate}
                data-test="use-template-btn"
              >
                <FileText class="h-4 w-4" />
                <span>Use This Template</span>
              </Button>
            </Card.Footer>
          </Card.Root>
        </div>

        <!-- Sidebar - 1/3 width on desktop -->
        <div class="space-y-6" data-test="template-sidebar">
          <Card.Root>
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <BookOpen class="h-5 w-5 text-primary" />
                Template Rating
              </Card.Title>
              <Card.Description>
                Rate this template and see what others think
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <VoteButtons
                voteCount={template.vote_count}
                userVote={template.user_vote}
                creatorId={template.creator?.id}
                templateId={id}
                class="flex justify-center w-full"
              />
            </Card.Content>
          </Card.Root>

          {#if template.created_at}
            <Card.Root data-test="template-info-card">
              <Card.Header>
                <Card.Title class="flex items-center gap-2">
                  <Calendar class="h-5 w-5 text-primary" />
                  Template Information
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <dl class="grid grid-cols-2 gap-y-3 text-sm">
                  <dt class="text-muted-foreground font-medium">Created</dt>
                  <dd class="text-right" data-test="template-created-date">
                    {formatDate(template.created_at)}
                  </dd>

                  <dt class="text-muted-foreground font-medium">Assessments</dt>
                  <dd class="text-right" data-test="template-assessment-count">
                    {template.assessments?.length || 0}
                  </dd>

                  <dt class="text-muted-foreground font-medium">
                    Total Weight
                  </dt>
                  <dd class="text-right" data-test="template-total-weight">
                    {totalWeight.toFixed(1)}%
                  </dd>
                </dl>
              </Card.Content>
            </Card.Root>
          {/if}

          <Card.Root data-test="creator-card">
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <User class="h-5 w-5 text-primary" />
                Created By
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {#if template.creator}
                <div class="flex items-center gap-3" data-test="creator-info">
                  <div
                    class="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                  >
                    {template.creator.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p class="font-medium" data-test="creator-username">
                      {template.creator.username}
                    </p>
                    <Link
                      to={`/user/${template.creator.id}`}
                      class="text-sm text-primary hover:underline"
                      data-test="creator-profile-link"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              {:else}
                <p class="text-muted-foreground">Anonymous user</p>
              {/if}
            </Card.Content>
          </Card.Root>
        </div>
      </div>
    {:else}
      <div class="text-center py-20" data-test="template-not-found">
        <FileText class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 class="text-2xl font-semibold mb-2">Template Not Found</h2>
        <p class="text-muted-foreground max-w-md mx-auto">
          The template you're looking for doesn't exist or might have been
          removed.
        </p>
        <Link to="/search" data-test="browse-templates-link">
          <Button variant="outline" class="mt-6">Browse Templates</Button>
        </Link>
      </div>
    {/if}
  </div>
</div>
