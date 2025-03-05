<div class="container">
	<div class="header">
		<h1>Search Calculator Templates</h1>
	</div>

	<div class="search-form">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by name..."
			on:input={handleSearch}
		/>
		<input
			type="text"
			bind:value={term}
			placeholder="Term (e.g. Fall, Spring)"
			on:input={handleSearch}
		/>
		<input
			type="number"
			bind:value={year}
			placeholder="Year"
			on:input={handleSearch}
		/>
		<input
			type="text"
			bind:value={institution}
			placeholder="Institution"
			on:input={handleSearch}
		/>
	</div>

	<div class="results">
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
										on:click={() => handleVote(template, 1)}
									>▲</button>
									<span class="vote-count">{template.vote_count}</span>
									<button
										class="vote-btn"
										class:active={template.user_vote === -1}
										on:click={() => handleVote(template, -1)}
									>▼</button>
								</div>
								<div class="action-buttons">
									<button on:click={() => useTemplate(template.id)}>Use Template</button>
									<button on:click={() => toggleComments(template.id)}>
										{activeComments === template.id ? 'Hide Comments' : 'Show Comments'}
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
			<div class="pagination">
				{#if currentPage > 1}
					<button on:click={() => changePage(currentPage - 1)}>Previous</button>
				{/if}
				<span>Page {currentPage} of {totalPages}</span>
				{#if currentPage < totalPages}
					<button on:click={() => changePage(currentPage + 1)}>Next</button>
				{/if}
			</div>
		{:else}
			<p>No templates found matching your search.</p>
		{/if}
	</div>
</div>

<script>
	import { navigate } from 'svelte-routing';
	import debounce from 'lodash/debounce';
	import Comments from './Comments.svelte';

	let searchQuery = '';
	let term = '';
	let year = '';
	let institution = '';
	let templates = [];
	let currentPage = 1;
	let totalPages = 1;
	let totalResults = 0;
	const ITEMS_PER_PAGE = 2;
	let activeComments = null;

	const debouncedSearch = debounce(async () => {
		const params = new URLSearchParams({
			query: searchQuery,
			term,
			year: year || '',
			institution,
			page: currentPage,
			limit: ITEMS_PER_PAGE
		});

		const response = await fetch(`/api/templates/search?${params}`);
		if (response.ok) {
			const data = await response.json();
			templates = data.templates;
			totalResults = data.total;
			totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
		}
	}, 300);

	function handleSearch() {
		currentPage = 1;  // Reset to first page on new search
		debouncedSearch();
	}

	function changePage(newPage) {
		currentPage = newPage;
		debouncedSearch();
	}

	async function handleVote(template, vote) {
		// If clicking the same vote button again, remove the vote
		if (template.user_vote === vote) {
			const response = await fetch(`/api/templates/${template.id}/vote`, {
				method: 'DELETE'
			});

			if (response.ok) {
				const { vote_count } = await response.json();
				templates = templates.map(t =>
					t.id === template.id
						? { ...t, vote_count, user_vote: 0 }
						: t
				);
			}
		} else {
			// Add or change vote
			const response = await fetch(`/api/templates/${template.id}/vote`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vote })
			});

			if (response.ok) {
				const { vote_count, user_vote } = await response.json();
				templates = templates.map(t =>
					t.id === template.id
						? { ...t, vote_count, user_vote }
						: t
				);
			}
		}
	}

	async function useTemplate(templateId) {
		const response = await fetch(`/api/templates/${templateId}/use`, {
			method: 'POST'
		});

		if (response.ok) {
			const { id } = await response.json();
			navigate(`/calculator/${id}`);
		}
	}

	function toggleComments(templateId) {
		activeComments = activeComments === templateId ? null : templateId;
	}

	// Initial search on mount
	debouncedSearch();
</script>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.header {
		margin-bottom: 20px;
	}

	.search-form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 10px;
		margin-bottom: 20px;
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

	.pagination {
		display: flex;
		justify-content: center;
		gap: 20px;
		align-items: center;
		margin-top: 20px;
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