<script>
    import { userId } from '../lib/stores.js';
    import * as templateApi from '../lib/api/templates.js';

    export let voteCount;
    export let userVote;
    export let creatorId;
    export let templateId;

    let loading = false;
    let localVoteCount = voteCount;
    let localUserVote = userVote;
    $: isCreator = creatorId === $userId;

    async function handleVote(vote) {
        if (loading || isCreator) return;
        loading = true;

        try {
            // If clicking the same vote button again, remove the vote
            if (localUserVote === vote) {
                const data = await templateApi.removeVote(templateId);
                localVoteCount = data.vote_count;
                localUserVote = 0;
            } else {
                const data = await templateApi.voteOnTemplate(templateId, vote);
                localVoteCount = data.vote_count;
                localUserVote = vote;
            }
        } catch (error) {
            console.error('Error voting:', error);
            alert('Failed to vote on template');
        } finally {
            loading = false;
        }
    }
</script>

<div class="vote-buttons">
    <button
        class:voted={!isCreator && localUserVote === 1}
        on:click={() => handleVote(1)}
        disabled={isCreator || loading}
    >▲</button>
    <output>{localVoteCount}</output>
    <button
        class:voted={!isCreator && localUserVote === -1}
        on:click={() => handleVote(-1)}
        disabled={isCreator || loading}
    >▼</button>
</div>

<style>
    .vote-buttons {
        display: flex;
        align-items: center;
    }

    .voted {
        color: blue;
    }

    /* Add visual indication that creator can't vote or when loading */
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>