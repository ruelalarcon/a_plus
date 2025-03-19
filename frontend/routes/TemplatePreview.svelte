<script>
    import { onMount } from 'svelte';
    import { navigate } from 'svelte-routing';
    import Card from '../components/Card.svelte';
    import VoteButtons from '../components/VoteButtons.svelte';
    import Comments from '../components/Comments.svelte';
    import * as templateApi from '../lib/api/templates.js';

    export let id; // Template ID from route params

    let template = null;
    let showComments = false;

    onMount(async () => {
        await loadTemplate();
    });

    async function loadTemplate() {
        try {
            const data = await templateApi.getTemplate(id);
            template = {
                ...data.template,
                assessments: data.assessments
            };
        } catch (error) {
            console.error('Error loading template:', error);
        }
    }

    async function useTemplate() {
        try {
            const { id: calculatorId } = await templateApi.useTemplate(id);
            navigate(`/calculator/${calculatorId}`);
        } catch (error) {
            console.error('Error using template:', error);
            alert('Failed to use template');
        }
    }
</script>

<main class="container">
    {#if template}
        <header>
            <h1>{template.name}</h1>
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
                        templateId={id}
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
    {:else}
        <p>Loading...</p>
    {/if}
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