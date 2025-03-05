<script>
    import { Link } from 'svelte-routing';
    import { navigate } from 'svelte-routing';
    import Card from './Card.svelte';
    import { onMount } from 'svelte';

    let calculators = [];

    onMount(async () => {
        await loadCalculators();
    });

    async function loadCalculators() {
        const response = await fetch('/api/calculators');
        if (response.ok) {
            calculators = await response.json();
        }
    }

    async function createNewCalculator() {
        const name = prompt('Enter a name for your new calculator:');
        if (!name) return;

        const response = await fetch('/api/calculators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            const newCalc = await response.json();
            navigate(`/calculator/${newCalc.id}`);
        }
    }

    async function deleteCalculator(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            return;
        }

        const response = await fetch(`/api/calculators/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            calculators = calculators.filter(calc => calc.id !== id);
        }
    }

    async function renameCalculator(calculator) {
        const newName = prompt('Enter a new name for your calculator:', calculator.name);
        if (!newName || newName === calculator.name) return;

        const response = await fetch(`/api/calculators/${calculator.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });

        if (response.ok) {
            calculators = calculators.map(calc =>
                calc.id === calculator.id
                    ? { ...calc, name: newName }
                    : calc
            );
        } else {
            alert('Failed to rename calculator');
        }
    }

    // Calculate the weighted average grade for a set of assessments
    function calculateFinalGrade(assessments) {
        // Filter out assessments that don't have both grade and weight
        const gradedAssessments = assessments.filter(assessment =>
            assessment.grade !== null &&
            assessment.grade !== undefined &&
            assessment.grade !== '' &&
            assessment.weight !== null &&
            assessment.weight !== undefined &&
            assessment.weight !== '');

        if (gradedAssessments.length === 0) return 'N/A';

        // Calculate total weight of all graded assessments
        const totalWeight = gradedAssessments.reduce((sum, assessment) =>
            sum + Number(assessment.weight), 0);

        if (totalWeight === 0) return 'N/A';

        // Calculate weighted sum of grades
        const weightedSum = gradedAssessments.reduce((sum, assessment) => {
            const weight = Number(assessment.weight);
            const grade = Number(assessment.grade);
            return sum + (grade * weight);
        }, 0);

        // Return final grade as percentage with 2 decimal places
        return (weightedSum / totalWeight).toFixed(2);
    }
</script>

<section class="calculators">
    <header>
        <h2>Your Grade Calculators</h2>
    </header>

    {#if calculators.length > 0}
        <div class="calculator-grid">
            {#each calculators as calc}
                <div>
                    <Card
                        title={calc.name}
                        details={[`Current Average: ${calculateFinalGrade(calc.assessments)}%`]}
                    >
                        <nav slot="actions">
                            <Link to={`/calculator/${calc.id}`}>Open Calculator</Link>
                            <button on:click={() => renameCalculator(calc)}>
                                Rename
                            </button>
                            <button on:click={() => deleteCalculator(calc.id, calc.name)}>
                                Delete
                            </button>
                        </nav>
                    </Card>
                </div>
            {/each}
        </div>
    {:else}
        <p>No calculators yet.</p>
    {/if}

    <footer class="dashboard-actions">
        <button class="new-calc-btn" on:click={createNewCalculator}>
            Create New Calculator
        </button>
        <Link class="search-btn" to="/search">
            Search Templates
        </Link>
    </footer>
</section>

<style>
    .calculator-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .dashboard-actions {
        margin: 20px 0;
    }
</style>