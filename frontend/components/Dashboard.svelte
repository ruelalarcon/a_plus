<div class="container">
	<div class="header">
		<h1>Dashboard</h1>
		<div class="user-info">
			<p>Welcome, <span>{$username}</span></p>
			<button on:click={logout}>Logout</button>
		</div>
	</div>

	<div class="calculators">
		<h2>Your Grade Calculators</h2>
		{#if calculators.length > 0}
			<div class="calculator-grid">
				{#each calculators as calc}
					<div class="calculator-card">
						<h3>{calc.name}</h3>
						<p>Current Average: {calculateFinalGrade(calc.assessments)}%</p>
						<div class="calculator-actions">
							<Link to={`/calculator/${calc.id}`}>Open Calculator</Link>
							<button on:click={() => renameCalculator(calc)}>Rename</button>
							<button on:click={() => deleteCalculator(calc.id, calc.name)}>Delete</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p>No calculators yet.</p>
		{/if}

		<div class="dashboard-actions">
			<button class="new-calc-btn" on:click={createNewCalculator}>
				Create New Calculator
			</button>
			<Link class="search-btn" to="/search">
				Search Templates
			</Link>
		</div>
	</div>
</div>

<script>
	import { Link } from 'svelte-routing';
	import { username, logout } from '../lib/stores.js';
	import { onMount } from 'svelte';
	import { navigate } from 'svelte-routing';

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
</script>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.calculator-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 20px;
		margin-bottom: 20px;
	}

	.calculator-card {
		padding: 20px;
		border: 1px solid #ccc;
	}

	.calculator-card h3 {
		margin: 0 0 10px 0;
	}

	.calculator-actions {
		display: flex;
		gap: 10px;
		margin-top: 10px;
	}

	.dashboard-actions {
		display: flex;
		gap: 15px;
		margin-top: 20px;
	}
</style>