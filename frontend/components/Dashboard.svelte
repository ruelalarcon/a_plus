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

	<div class="published-templates">
		<h2>My Published Templates</h2>
		{#if templates.length > 0}
			<div class="template-grid">
				{#each templates as template}
					<div class="template-card">
						<h3>{template.name}</h3>
						<div class="template-details">
							<p>{template.institution} - {template.term} {template.year}</p>
							<p>Created by {template.creator_name}</p>
							<div class="template-actions">
								<div class="vote-buttons">
									<button
										class="vote-btn"
										class:active={template.user_vote === 1}
										disabled={true}
									>▲</button>
									<span class="vote-count">{template.vote_count}</span>
									<button
										class="vote-btn"
										class:active={template.user_vote === -1}
										disabled={true}
									>▼</button>
								</div>
								<div class="action-buttons">
									<button on:click={() => toggleComments(template.id)}>
										{activeComments === template.id ? 'Hide Comments' : 'Show Comments'}
									</button>
									<button on:click={() => deleteTemplate(template.id, template.name)}>
										Delete
									</button>
								</div>
							</div>
						</div>
						{#if activeComments === template.id}
							<div class="comments-container">
								<Comments templateId={template.id} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p>No published templates yet.</p>
		{/if}
	</div>
</div>

<script>
	import { Link } from 'svelte-routing';
	import { username, logout } from '../lib/stores.js';
	import { onMount } from 'svelte';
	import { navigate } from 'svelte-routing';
	import Comments from './Comments.svelte';

	let calculators = [];
	let templates = [];
	let activeComments = null;

	onMount(async () => {
		await Promise.all([
			loadCalculators(),
			loadTemplates()
		]);
	});

	async function loadCalculators() {
		const response = await fetch('/api/calculators');
		if (response.ok) {
			calculators = await response.json();
		}
	}

	async function loadTemplates() {
		const response = await fetch('/api/user/templates');
		if (response.ok) {
			templates = await response.json();
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

	async function deleteTemplate(id, name) {
		if (!confirm(`Are you sure you want to delete "${name}"? The template will be hidden from search but existing copies will remain.`)) {
			return;
		}

		const response = await fetch(`/api/templates/${id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			templates = templates.filter(t => t.id !== id);
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

	function toggleComments(templateId) {
		activeComments = activeComments === templateId ? null : templateId;
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

	.published-templates {
		margin-top: 40px;
	}

	.template-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		margin-bottom: 20px;
	}

	.template-card {
		padding: 20px;
		border: 1px solid #ccc;
	}

	.template-card h3 {
		margin: 0 0 10px 0;
	}

	.template-details {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.template-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 10px;
	}

	.vote-buttons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.vote-btn {
		padding: 0 5px;
		font-size: 1.2em;
		line-height: 1;
		opacity: 0.6;
	}

	.vote-btn.active {
		opacity: 1;
	}

	.vote-count {
		font-weight: bold;
		min-width: 2em;
		text-align: center;
	}

	.action-buttons {
		display: flex;
		gap: 10px;
	}

	.comments-container {
		margin-top: 20px;
		border-top: 1px solid #eee;
	}
</style>