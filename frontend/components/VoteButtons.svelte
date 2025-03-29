<script>
  import { userId } from "../lib/stores.js";
  import { Button } from "$lib/components/ui/button";
  import { onMount } from "svelte";
  import { mutate } from "../lib/graphql/client.js";
  import {
    VOTE_TEMPLATE,
    REMOVE_TEMPLATE_VOTE,
  } from "../lib/graphql/mutations.js";

  export let voteCount;
  export let userVote;
  export let creatorId;
  export let templateId;

  // Initialize local state only once to prevent unnecessary rerenders
  let loading = false;
  let localVoteCount;
  let localUserVote;
  let isCreator = false;

  // Initialize values only on mount
  onMount(() => {
    localVoteCount = voteCount;
    localUserVote = userVote;
    checkCreator();
  });

  // Update creator status when userId changes
  function checkCreator() {
    if ($userId && creatorId) {
      // Force both to strings for comparison
      isCreator = String($userId) === String(creatorId);
    } else {
      isCreator = false;
    }
  }

  // Subscribe to userId changes to update creator status
  $: if ($userId !== undefined) checkCreator();

  async function handleVote(vote) {
    if (loading || isCreator) return;

    // Optimistically update UI first
    const previousVote = localUserVote;
    const previousCount = localVoteCount;

    if (localUserVote === vote) {
      // Removing vote - update locally immediately
      localUserVote = 0;
      localVoteCount -= vote; // Subtract the vote value (1 or -1)
    } else {
      // Adding/changing vote - update locally immediately
      // If changing vote (e.g. from -1 to 1), we need to change by 2
      const adjustment = previousVote ? vote - previousVote : vote;
      localVoteCount += adjustment;
      localUserVote = vote;
    }

    // Set loading to prevent multiple clicks
    loading = true;

    try {
      // Make API call in background
      if (previousVote === vote) {
        // Remove vote
        mutate(REMOVE_TEMPLATE_VOTE, { templateId }).catch((error) => {
          console.error("Error removing vote:", error);
          // Revert on error
          localVoteCount = previousCount;
          localUserVote = previousVote;
        });
      } else {
        // Add/change vote
        mutate(VOTE_TEMPLATE, { templateId, vote }).catch((error) => {
          console.error("Error voting:", error);
          // Revert on error
          localVoteCount = previousCount;
          localUserVote = previousVote;
        });
      }
    } finally {
      // Enable button again after short delay to prevent spam clicking
      setTimeout(() => {
        loading = false;
      }, 300);
    }
  }
</script>

<div class="vote-buttons">
  <Button
    variant={localUserVote === 1 ? "default" : "outline"}
    size="icon"
    on:click={() => handleVote(1)}
    disabled={isCreator || loading}
    class="vote-button"
    aria-label="Upvote"
  >
    <span class="text-lg">👍</span>
  </Button>

  <span class="vote-count">{localVoteCount ?? voteCount}</span>

  <Button
    variant={localUserVote === -1 ? "default" : "outline"}
    size="icon"
    on:click={() => handleVote(-1)}
    disabled={isCreator || loading}
    class="vote-button"
    aria-label="Downvote"
  >
    <span class="text-lg">👎</span>
  </Button>
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
