<script>
    import { Link, navigate } from 'svelte-routing';
    import { onMount } from 'svelte';
    import Comments from '../components/Comments.svelte';
    import Card from '../components/Card.svelte';
    import VoteButtons from '../components/VoteButtons.svelte';
    import * as calculatorApi from '../lib/api/calculators.js';
    import { calculateFinalGrade } from '../lib/utils/gradeCalculations.js';

    export let id; // Calculator ID from route params

    let calculator = { name: '', id: '' };
    let assessments = [];
    $: finalGrade = calculateFinalGrade(assessments);

    let showComments = false;

    onMount(async () => {
        await loadCalculator();
    });

    async function loadCalculator() {
        try {
            const data = await calculatorApi.getCalculator(id);
            calculator = data.calculator;
            assessments = data.assessments;
        } catch (error) {
            console.error('Error loading calculator:', error);
        }
    }

    function addAssessment() {
        assessments = [...assessments, { name: '', weight: '', grade: '' }];
    }

    function removeAssessment(index) {
        assessments = assessments.filter((_, i) => i !== index);
    }

    async function saveCalculator() {
        try {
            await calculatorApi.updateCalculator(id, { assessments });
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Error saving calculator:', error);
            alert('Failed to save changes');
        }
    }

    async function deleteCalculator() {
        if (!confirm('Are you sure you want to delete this calculator? This cannot be undone.')) {
            return;
        }

        try {
            await calculatorApi.deleteCalculator(id);
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Error deleting calculator:', error);
            alert('Failed to delete calculator');
        }
    }

    async function publishTemplate() {
        const name = prompt('Enter a name for your template:', calculator.name);
        if (!name) return;

        const term = prompt('Enter the term (e.g. Fall, Spring):');
        if (!term) return;

        const yearStr = prompt('Enter the year:');
        if (!yearStr) return;
        const year = parseInt(yearStr);
        if (isNaN(year)) {
            alert('Please enter a valid year');
            return;
        }

        const institution = prompt('Enter the institution name:');
        if (!institution) return;

        const templateData = {
            name,
            term,
            year,
            institution,
            assessments: assessments.map(({ name, weight }) => ({ name, weight }))
        };

        try {
            await calculatorApi.publishTemplate(id, templateData);
            alert('Template published successfully!');
        } catch (error) {
            console.error('Error publishing template:', error);
            alert('Failed to publish template');
        }
    }

    async function renameCalculator() {
        const newName = prompt('Enter a new name for your calculator:', calculator.name);
        if (!newName || newName === calculator.name) return;

        try {
            await calculatorApi.updateCalculator(id, { name: newName });
            calculator.name = newName;
            calculator = calculator; // Trigger reactivity
        } catch (error) {
            console.error('Error renaming calculator:', error);
            alert('Failed to rename calculator');
        }
    }
</script>

<main class="container">
    <header class="header">
        <div class="header-title">
            <h1>{calculator.name}</h1>
            <button class="rename-btn" on:click={renameCalculator}>Rename</button>
        </div>
        <nav class="header-actions">
            <button class="publish-btn" on:click={publishTemplate}>Publish Template</button>
            <button class="delete-btn" on:click={deleteCalculator}>Delete Calculator</button>
            <Link to="/">Back to Dashboard</Link>
        </nav>
    </header>

    <section class="calculator-content">
        <section class="assessments">
            <h2>Assessments</h2>
            <form class="assessment-grid">
                <header class="assessment-headers">
                    <span>Assessment Name</span>
                    <span>Weight (%)</span>
                    <span>Grade (%)</span>
                    <span></span>
                </header>
                {#each assessments as assessment, i}
                    <div class="assessment">
                        <input
                            type="text"
                            bind:value={assessment.name}
                            placeholder="Assessment name"
                        />
                        <input
                            type="number"
                            bind:value={assessment.weight}
                            min="0"
                            max="100"
                            placeholder="Weight"
                        />
                        <input
                            type="number"
                            bind:value={assessment.grade}
                            min="0"
                            max="100"
                            placeholder="Grade"
                        />
                        <button type="button" on:click={() => removeAssessment(i)}>Remove</button>
                    </div>
                {/each}
            </form>
            <button type="button" on:click={addAssessment}>Add Assessment</button>
        </section>

        <Card
            title="Final Grade"
            details={[`${finalGrade}%`]}
        >
            <div slot="actions">
                <button on:click={saveCalculator}>Save Changes</button>
            </div>
        </Card>

        {#if calculator.template_id}
            <Card
                title="Template Information"
                details={[`Based on template: ${calculator.template_name}`]}
                extraContent={showComments}
            >
                <div slot="actions">
                    <VoteButtons
                        voteCount={calculator.vote_count}
                        userVote={calculator.user_vote}
                        creatorId={calculator.template_user_id}
                        templateId={calculator.template_id}
                    />
                    <button on:click={() => showComments = !showComments}>
                        {showComments ? 'Hide' : 'Show'} Comments
                    </button>
                </div>
                <div slot="extra">
                    <Comments templateId={calculator.template_id} />
                </div>
            </Card>
        {/if}
    </section>
</main>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .header-actions {
        display: flex;
        gap: 10px;
    }

    .assessment-grid {
        margin-bottom: 20px;
    }

    .assessment-headers {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr auto;
        gap: 10px;
        margin-bottom: 10px;
        font-weight: bold;
    }

    .assessment {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr auto;
        gap: 10px;
        margin-bottom: 10px;
    }
</style>