<script>
    import { userId } from '../lib/stores.js';

    export let voteCount;
    export let userVote;
    export let creatorId;
    export let onVote;

    $: isCreator = creatorId === $userId;
</script>

<div class="vote-buttons">
    <button
        class:voted={!isCreator && userVote === 1}
        on:click={() => onVote(1)}
        disabled={isCreator}
    >▲</button>
    <output>{voteCount}</output>
    <button
        class:voted={!isCreator && userVote === -1}
        on:click={() => onVote(-1)}
        disabled={isCreator}
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

    /* Add visual indication that creator can't vote */
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>