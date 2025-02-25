<div class="container">
    <div class="header">
        <h1>{calculator.name}</h1>
        <Link to="/">Back to Dashboard</Link>
    </div>

    <div class="calculator-content">
        <div class="assessments">
            <h2>Assessments</h2>
            <div class="assessment-grid">
                <div class="assessment-headers">
                    <span>Assessment Name</span>
                    <span>Weight (%)</span>
                    <span>Grade (%)</span>
                    <span></span>
                </div>
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
                        <button on:click={() => removeAssessment(i)}>Remove</button>
                    </div>
                {/each}
            </div>
            <button on:click={addAssessment}>Add Assessment</button>
        </div>

        <div class="total">
            <h2>Final Grade: {finalGrade}%</h2>
            <button on:click={saveCalculator}>Save Changes</button>
        </div>
    </div>
</div>

<script>
    import { Link } from 'svelte-routing';
    import { onMount } from 'svelte';

    export let id; // Calculator ID from route params

    let calculator = { name: '', id: '' };
    let assessments = [];
    $: finalGrade = calculateFinalGrade(assessments);

    onMount(async () => {
        await loadCalculator();
    });

    async function loadCalculator() {
        const response = await fetch(`/api/calculators/${id}`);
        if (response.ok) {
            const data = await response.json();
            calculator = data.calculator;
            assessments = data.assessments;
        }
    }

    function addAssessment() {
        assessments = [...assessments, { name: '', weight: '', grade: '' }];
    }

    function removeAssessment(index) {
        assessments = assessments.filter((_, i) => i !== index);
    }

    function calculateFinalGrade(assessments) {
        // Filter to only assessments that have grades
        const gradedAssessments = assessments.filter(assessment =>
            assessment.grade !== null &&
            assessment.grade !== undefined &&
            assessment.grade !== '' &&
            assessment.weight !== null &&
            assessment.weight !== undefined &&
            assessment.weight !== '');

        if (gradedAssessments.length === 0) return 'N/A';

        const totalWeight = gradedAssessments.reduce((sum, assessment) =>
            sum + Number(assessment.weight), 0);

        if (totalWeight === 0) return 'N/A';

        const weightedSum = gradedAssessments.reduce((sum, assessment) => {
            const weight = Number(assessment.weight);
            const grade = Number(assessment.grade);
            return sum + (grade * weight);
        }, 0);

        return (weightedSum / totalWeight).toFixed(2);
    }

    async function saveCalculator() {
        const response = await fetch(`/api/calculators/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assessments })
        });

        if (response.ok) {
            alert('Changes saved successfully!');
        }
    }
</script>

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
        margin-bottom: 30px;
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

    .total {
        margin-top: 30px;
        padding: 20px;
    }

    input {
        padding: 8px;
    }
</style>