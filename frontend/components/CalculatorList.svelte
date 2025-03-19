<script>
    import { Link } from 'svelte-routing';
    import { navigate } from 'svelte-routing';
    import Card from './Card.svelte';
    import { onMount } from 'svelte';
    import * as calculatorApi from '../lib/api/calculators.js';
    import { calculateFinalGrade } from '../lib/utils/gradeCalculations.js';

    let calculators = [];

    onMount(async () => {
        await loadCalculators();
    });

    async function loadCalculators() {
        try {
            calculators = await calculatorApi.getCalculators();
        } catch (error) {
            console.error('Error loading calculators:', error);
        }
    }

    async function createNewCalculator() {
        const name = prompt('Enter a name for your new calculator:');
        if (!name) return;

        try {
            const newCalc = await calculatorApi.createCalculator(name);
            navigate(`/calculator/${newCalc.id}`);
        } catch (error) {
            console.error('Error creating calculator:', error);
            alert('Failed to create calculator');
        }
    }

    async function deleteCalculator(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            return;
        }

        try {
            await calculatorApi.deleteCalculator(id);
            calculators = calculators.filter(calc => calc.id !== id);
        } catch (error) {
            console.error('Error deleting calculator:', error);
            alert('Failed to delete calculator');
        }
    }

    async function renameCalculator(calculator) {
        const newName = prompt('Enter a new name for your calculator:', calculator.name);
        if (!newName || newName === calculator.name) return;

        try {
            await calculatorApi.updateCalculator(calculator.id, { name: newName });
            calculators = calculators.map(calc =>
                calc.id === calculator.id
                    ? { ...calc, name: newName }
                    : calc
            );
        } catch (error) {
            console.error('Error renaming calculator:', error);
            alert('Failed to rename calculator');
        }
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