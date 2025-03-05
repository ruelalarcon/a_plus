<script>
    import { navigate } from 'svelte-routing';
    import debounce from 'lodash/debounce';
    import Comments from '../components/Comments.svelte';
    import Card from '../components/Card.svelte';
    import VoteButtons from '../components/VoteButtons.svelte';

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

<main class="container">
    <header class="page-header">
        <h1>Search Calculator Templates</h1>
    </header>

    <section class="search-section">
        <form class="search-form" onsubmit="return false;">
            <div class="form-group">
                <label for="search-query">Search Templates</label>
                <input
                    type="search"
                    id="search-query"
                    bind:value={searchQuery}
                    placeholder="Search by name..."
                    on:input={handleSearch}
                />
            </div>

            <div class="form-group">
                <label for="term">Term</label>
                <input
                    type="text"
                    id="term"
                    bind:value={term}
                    placeholder="Term (e.g. Fall, Spring)"
                    on:input={handleSearch}
                />
            </div>

            <div class="form-group">
                <label for="year">Year</label>
                <input
                    type="number"
                    id="year"
                    bind:value={year}
                    placeholder="Year"
                    on:input={handleSearch}
                />
            </div>

            <div class="form-group">
                <label for="institution">Institution</label>
                <input
                    type="text"
                    id="institution"
                    bind:value={institution}
                    placeholder="Institution"
                    on:input={handleSearch}
                />
            </div>
        </form>
    </section>

    <section class="results">
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
                                    onVote={(vote) => handleVote(template, vote)}
                                />
                                <div class="action-buttons">
                                    <button on:click={() => useTemplate(template.id)}>
                                        Use Template
                                    </button>
                                    <button on:click={() => toggleComments(template.id)}>
                                        {activeComments === template.id ? 'Hide' : 'Show'} Comments
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

            <nav class="pagination">
                {#if currentPage > 1}
                    <button on:click={() => changePage(currentPage - 1)}>
                        Previous
                    </button>
                {/if}
                <span>Page {currentPage} of {totalPages}</span>
                {#if currentPage < totalPages}
                    <button on:click={() => changePage(currentPage + 1)}>
                        Next
                    </button>
                {/if}
            </nav>
        {:else}
            <p>No templates found matching your search.</p>
        {/if}
    </section>
</main>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    .page-header {
        margin-bottom: 20px;
    }

    .search-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        margin-bottom: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .form-group label {
        font-weight: 500;
    }

    .form-group input {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .action-buttons {
        display: flex;
        gap: 10px;
    }

    .pagination {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 20px;
        align-items: center;
    }
</style>