<script>
    import Card from './Card.svelte';
    import VoteButtons from './VoteButtons.svelte';
    import Comments from './Comments.svelte';
    import { onMount } from 'svelte';
    import * as templateApi from '../lib/api/templates.js';

    let templates = [];
    let activeComments = null;

    onMount(async () => {
        await loadTemplates();
    });

    async function loadTemplates() {
        try {
            templates = await templateApi.getUserTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    async function deleteTemplate(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"? The template will be hidden from search but existing copies will remain.`)) {
            return;
        }

        try {
            await templateApi.deleteTemplate(id);
            templates = templates.filter(t => t.id !== id);
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    }

    function toggleComments(templateId) {
        activeComments = activeComments === templateId ? null : templateId;
    }

    function copyShareLink(templateId) {
        const url = `${window.location.origin}/template/${templateId}`;
        navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
    }
</script>

<section class="published-templates">
    <header>
        <h2>My Published Templates</h2>
    </header>

    {#if templates.length > 0}
        <div class="template-grid">
            {#each templates as template}
                <div>
                    <Card
                        title={template.name}
                        details={[
                            `${template.institution} - ${template.term} ${template.year}`,
                            `Created by ${template.creator_name}`
                        ]}
                        extraContent={activeComments === template.id}
                    >
                        <nav slot="actions">
                            <VoteButtons
                                voteCount={template.vote_count}
                                userVote={template.user_vote}
                                creatorId={template.user_id}
                                templateId={template.id}
                            />
                            <div class="action-buttons">
                                <button on:click={() => copyShareLink(template.id)}>
                                    Share URL
                                </button>
                                <button on:click={() => toggleComments(template.id)}>
                                    {activeComments === template.id ? 'Hide' : 'Show'} Comments
                                </button>
                                <button on:click={() => deleteTemplate(template.id, template.name)}>
                                    Delete
                                </button>
                            </div>
                        </nav>
                        <div slot="extra">
                            <Comments templateId={template.id} />
                        </div>
                    </Card>
                </div>
            {/each}
        </div>
    {:else}
        <p>No published templates yet.</p>
    {/if}
</section>

<style>
    .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .action-buttons {
        display: flex;
        gap: 10px;
    }
</style>