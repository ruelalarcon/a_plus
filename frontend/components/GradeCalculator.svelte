<div class="container">
	<div class="header">
		<div>
			<h1>{calculator.name}</h1>
			<button class="rename-btn" on:click={renameCalculator}>Rename</button>
		</div>
		<div class="header-actions">
			<button class="publish-btn" on:click={publishTemplate}>Publish Template</button>
			<button class="delete-btn" on:click={deleteCalculator}>Delete Calculator</button>
			<Link to="/">Back to Dashboard</Link>
		</div>
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

		{#if calculator.template_id}
			<div class="template-info">
				<p>Based on template: {calculator.template_name}</p>
				<div class="template-actions">
					<button
						class="vote-btn"
						class:active={calculator.user_vote === 1 && calculator.template_user_id !== $userId}
						on:click={() => handleVote(1)}
						disabled={loading || calculator.template_user_id === $userId}
					>▲</button>
					<span>{calculator.vote_count}</span>
					<button
						class="vote-btn"
						class:active={calculator.user_vote === -1 && calculator.template_user_id !== $userId}
						on:click={() => handleVote(-1)}
						disabled={loading || calculator.template_user_id === $userId}
					>▼</button>
					<button on:click={() => showComments = !showComments}>
						{showComments ? 'Hide' : 'Show'} Comments
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showComments && calculator.template_id}
	<Comments templateId={calculator.template_id} />
{/if}

<script>
	import { Link, navigate } from 'svelte-routing';
	import { onMount } from 'svelte';
	import Comments from './Comments.svelte';
	import { userId } from '../lib/stores.js';

	export let id; // Calculator ID from route params

	let calculator = { name: '', id: '' };
	let assessments = [];
	$: finalGrade = calculateFinalGrade(assessments);

	let showComments = false;
	let loading = false;

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

	async function deleteCalculator() {
		if (!confirm('Are you sure you want to delete this calculator? This cannot be undone.')) {
			return;
		}

		const response = await fetch(`/api/calculators/${id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			navigate('/', { replace: true });
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

		const response = await fetch('/api/templates', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(templateData)
		});

		if (response.ok) {
			alert('Template published successfully!');
		} else {
			alert('Failed to publish template');
		}
	}

	async function renameCalculator() {
		const newName = prompt('Enter a new name for your calculator:', calculator.name);
		if (!newName || newName === calculator.name) return;

		const response = await fetch(`/api/calculators/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newName })
		});

		if (response.ok) {
			calculator.name = newName;
			calculator = calculator; // Trigger reactivity
		} else {
			alert('Failed to rename calculator');
		}
	}

	async function handleVote(vote) {
		if (loading) return;
		loading = true;

		try {
			const method = calculator.user_vote === vote ? 'DELETE' : 'POST';
			const response = await fetch(`/api/templates/${calculator.template_id}/vote`, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: method === 'POST' ? JSON.stringify({ vote }) : undefined
			});

			if (!response.ok) {
				throw new Error('Failed to vote');
			}

			const data = await response.json();
			calculator.vote_count = data.vote_count;
			calculator.user_vote = method === 'POST' ? vote : 0;
		} catch (error) {
			console.error('Error voting:', error);
		} finally {
			loading = false;
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
		margin-bottom: 30px;
		padding: 20px;
	}

	input {
		padding: 8px;
	}

	.header-actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.header div:first-child {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.template-info {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.template-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
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
</style>