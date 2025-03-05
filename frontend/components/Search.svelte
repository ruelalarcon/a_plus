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
							<button on:click={() => useTemplate(template.id)}>Use Template</button>
						</div>
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

	let searchQuery = '';
	let term = '';
	let year = '';
	let institution = '';
	let templates = [];
	let currentPage = 1;
	let totalPages = 1;
	let totalResults = 0;
	const ITEMS_PER_PAGE = 20;

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

	async function useTemplate(templateId) {
		const response = await fetch(`/api/templates/${templateId}/use`, {
			method: 'POST'
		});

		if (response.ok) {
			const { id } = await response.json();
			navigate(`/calculator/${id}`);
		}
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
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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

	.pagination {
		display: flex;
		justify-content: center;
		gap: 20px;
		align-items: center;
		margin-top: 20px;
	}
</style>