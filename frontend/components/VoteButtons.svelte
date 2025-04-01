<script>
  import { userId } from "../lib/stores.js";
  import { Button } from "$lib/components/ui/button";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { onMount } from "svelte";
  import { mutate } from "../lib/graphql/client.js";
  import {
    VOTE_TEMPLATE,
    REMOVE_TEMPLATE_VOTE,
    DELETE_TEMPLATE,
  } from "../lib/graphql/mutations.js";
  import { toast } from "svelte-sonner";

  // Icons
  import ThumbsUp from "lucide-svelte/icons/thumbs-up";
  import ThumbsDown from "lucide-svelte/icons/thumbs-down";
  import Lock from "lucide-svelte/icons/lock";
  import Trash2 from "lucide-svelte/icons/trash-2";

  // Props
  export let voteCount;
  export let userVote;
  export let creatorId;
  export let templateId;
  export let onDelete = () => {}; // Callback function when template is deleted

  // UI state
  let loading = false;
  let localVoteCount = 0;
  let localUserVote = 0;
  let isCreator = false;
  let deleteDialogOpen = false;

  // Initialize values on mount to prevent unnecessary rerenders
  onMount(() => {
    localVoteCount = voteCount;
    localUserVote = userVote;
    updateCreatorStatus();
  });

  // Update creator status when userId changes
  function updateCreatorStatus() {
    isCreator =
      $userId && creatorId ? String($userId) === String(creatorId) : false;
  }

  // Watch for userId changes to update creator status
  $: if ($userId !== undefined) updateCreatorStatus();

  /**
   * Handles voting on a template
   * @param {number} vote - The vote value (1 for upvote, -1 for downvote)
   */
  async function handleVote(vote) {
    if (loading || isCreator) return;

    // Store previous values for rollback
    const previousVote = localUserVote;
    const previousCount = localVoteCount;

    // Optimistically update UI
    if (localUserVote === vote) {
      // Removing vote
      localUserVote = 0;
      localVoteCount -= vote;
    } else {
      // Adding/changing vote
      const adjustment = previousVote ? vote - previousVote : vote;
      localVoteCount += adjustment;
      localUserVote = vote;
    }

    // Set loading state
    loading = true;

    try {
      // Make API call in background
      if (previousVote === vote) {
        // Remove vote
        await mutate(REMOVE_TEMPLATE_VOTE, { templateId });
      } else {
        // Add/change vote
        await mutate(VOTE_TEMPLATE, { templateId, vote });
      }
    } catch (error) {
      console.error("Error updating vote:", error);
      // Revert on error
      localVoteCount = previousCount;
      localUserVote = previousVote;
      toast.error("Failed to update vote");
    } finally {
      // Reset loading state after a brief delay to prevent spam clicking
      setTimeout(() => {
        loading = false;
      }, 300);
    }
  }

  /**
   * Handles template deletion
   */
  async function deleteTemplate() {
    try {
      const result = await mutate(DELETE_TEMPLATE, { id: templateId });
      if (result.deleteTemplate) {
        toast.success("Template deleted successfully");
        onDelete(templateId);
        deleteDialogOpen = false;
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  }
</script>

<div class="vote-buttons" data-test="vote-buttons">
  {#if isCreator}
    <div class="flex items-center gap-2">
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <div class="relative" use:builder.action {...builder}>
            <Button
              variant="outline"
              size="icon"
              disabled={true}
              class="vote-button opacity-70"
              aria-label="Upvote"
              data-test="disabled-upvote-btn"
            >
              <ThumbsUp class="h-4 w-4" />
              <Lock
                class="absolute bottom-0 right-0 h-3 w-3 text-muted-foreground"
              />
            </Button>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content>Cannot vote on your own template</Tooltip.Content>
      </Tooltip.Root>

      <span class="vote-count text-sm" data-test="vote-count"
        >{localVoteCount}</span
      >

      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <div class="relative" use:builder.action {...builder}>
            <Button
              variant="outline"
              size="icon"
              disabled={true}
              class="vote-button opacity-70"
              aria-label="Downvote"
              data-test="disabled-downvote-btn"
            >
              <ThumbsDown class="h-4 w-4" />
              <Lock
                class="absolute bottom-0 right-0 h-3 w-3 text-muted-foreground"
              />
            </Button>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content>Cannot vote on your own template</Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            variant="outline"
            size="icon"
            class="text-destructive hover:bg-destructive/10 ml-1"
            on:click={() => (deleteDialogOpen = true)}
            data-test="delete-template-btn"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Delete template</Tooltip.Content>
      </Tooltip.Root>

      <AlertDialog.Root
        open={deleteDialogOpen}
        onOpenChange={(open) => (deleteDialogOpen = open)}
        data-test="delete-template-dialog"
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete Template</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel data-test="cancel-delete-template-btn"
              >Cancel</AlertDialog.Cancel
            >
            <AlertDialog.Action
              on:click={deleteTemplate}
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-test="confirm-delete-template-btn"
            >
              Delete
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  {:else}
    <Button
      variant={localUserVote === 1 ? "default" : "outline"}
      size="icon"
      on:click={() => handleVote(1)}
      disabled={loading}
      class="vote-button"
      aria-label="Upvote"
      data-test="upvote-btn"
    >
      <ThumbsUp class="h-4 w-4" />
    </Button>

    <span class="vote-count text-sm" data-test="vote-count"
      >{localVoteCount}</span
    >

    <Button
      variant={localUserVote === -1 ? "default" : "outline"}
      size="icon"
      on:click={() => handleVote(-1)}
      disabled={loading}
      class="vote-button"
      aria-label="Downvote"
      data-test="downvote-btn"
    >
      <ThumbsDown class="h-4 w-4" />
    </Button>
  {/if}
</div>

<style>
  .vote-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .vote-count {
    font-weight: 500;
    min-width: 2rem;
    text-align: center;
  }
</style>
