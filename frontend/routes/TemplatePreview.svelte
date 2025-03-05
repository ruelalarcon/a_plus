<script>
    import { onMount } from 'svelte';
    import { navigate } from 'svelte-routing';
    import Card from '../components/Card.svelte';
    import VoteButtons from '../components/VoteButtons.svelte';
    import Comments from '../components/Comments.svelte';

    export let id; // Template ID from route params

    let template = {
        name: '',
        institution: '',
        term: '',
        year: '',
        creator_name: '',
        assessments: [],
        vote_count: 0,
        user_vote: 0,
        user_id: null
    };
    let showComments = false;
    let loading = false;

    onMount(async () => {
        await loadTemplate();
    });

    async function loadTemplate() {
        const response = await fetch(`/api/templates/${id}`);
        if (response.ok) {
            const data = await response.json();
            template = {
                ...template,
                ...data.template,
                assessments: data.assessments
            };
        }
    }

    async function useTemplate() {
        const response = await fetch(`/api/templates/${id}/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const { id: calculatorId } = await response.json();
            navigate(`/calculator/${calculatorId}`);
        }
    }

    async function handleVote(vote) {
        if (loading) return;
        loading = true;

        try {
            const method = template.user_vote === vote ? 'DELETE' : 'POST';
            const response = await fetch(`/api/templates/${id}/vote`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify({ vote }) : undefined
            });

            if (response.ok) {
                const data = await response.json();
                template.vote_count = data.vote_count;
                template.user_vote = method === 'POST' ? vote : 0;
            }
        } finally {
            loading = false;
        }
    }
</script>

<main class="container">
    <header>
        <h1>{template.name || 'Loading...'}</h1>
        {#if template.institution}
            <p>{template.institution} - {template.term} {template.year}</p>
        {/if}
        {#if template.creator_name}
            <p>Created by {template.creator_name}</p>
        {/if}
    </header>

    <section class="template-content">
        <div class="assessments">
            <h2>Assessments</h2>
            <div class="assessment-grid">
                <div class="assessment-headers">
                    <span>Assessment Name</span>
                    <span>Weight (%)</span>
                </div>
                {#each template.assessments as assessment}
                    <div class="assessment">
                        <span>{assessment.name}</span>
                        <span>{assessment.weight}%</span>
                    </div>
                {/each}
            </div>
        </div>

        <Card title="Template Actions">
            <div slot="actions">
                <button on:click={useTemplate}>
                    Use Template
                </button>
                <VoteButtons
                    voteCount={template.vote_count}
                    userVote={template.user_vote}
                    creatorId={template.user_id}
                    onVote={handleVote}
                />
                <button on:click={() => showComments = !showComments}>
                    {showComments ? 'Hide' : 'Show'} Comments
                </button>
            </div>
        </Card>

        {#if showComments}
            <Comments templateId={id} />
        {/if}
    </section>
</main>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .assessment-grid {
        margin: 20px 0;
    }

    .assessment-headers {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 10px;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .assessment {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
    }
</style>