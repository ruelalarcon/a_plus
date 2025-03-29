<script>
  import { navigate } from "svelte-routing";
  import debounce from "lodash/debounce";
  import Comments from "../components/Comments.svelte";
  import VoteButtons from "../components/VoteButtons.svelte";
  import { query, mutate } from "../lib/graphql/client.js";
  import { ALL_TEMPLATES } from "../lib/graphql/queries.js";
  import { USE_TEMPLATE } from "../lib/graphql/mutations.js";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";

  let searchQuery = "";
  let term = "";
  let year = "";
  let institution = "";
  let templates = [];
  let currentPage = 1;
  let totalPages = 1;
  let totalResults = 0;
  const ITEMS_PER_PAGE = 10;
  let activeComments = null;

  const debouncedSearch = debounce(async () => {
    try {
      // Convert year to number if it's not empty
      const yearNum = year ? parseInt(year) : undefined;

      const data = await query(ALL_TEMPLATES, {
        query: searchQuery || undefined,
        term: term || undefined,
        year: yearNum,
        institution: institution || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      templates = data.allTemplates.templates;
      totalResults = data.allTemplates.total;
      totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error searching templates:", error);
    }
  }, 300);

  function handleSearch() {
    currentPage = 1; // Reset to first page on new search
    debouncedSearch();
  }

  function changePage(newPage) {
    currentPage = newPage;
    debouncedSearch();
  }

  async function useTemplate(templateId) {
    try {
      const data = await mutate(USE_TEMPLATE, { templateId });
      if (data.useTemplate) {
        navigate(`/calculator/${data.useTemplate.id}`);
      } else {
        console.error("Failed to use template");
      }
    } catch (error) {
      console.error("Error using template:", error);
      alert("Failed to use template");
    }
  }

  function toggleComments(templateId) {
    activeComments = activeComments === templateId ? null : templateId;
  }

  // Initial search on mount
  debouncedSearch();
</script>

<main class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-3xl font-bold tracking-tight">
      Search Calculator Templates
    </h1>
  </header>

  <Card class="mb-8">
    <CardHeader>
      <CardTitle>Search Filters</CardTitle>
      <CardDescription
        >Find the perfect grade calculator template for your needs</CardDescription
      >
    </CardHeader>
    <CardContent>
      <form
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        onsubmit="return false;"
      >
        <div class="space-y-2">
          <Label for="search-query">Search Templates</Label>
          <Input
            type="search"
            id="search-query"
            bind:value={searchQuery}
            placeholder="Search by name..."
            on:input={handleSearch}
          />
        </div>

        <div class="space-y-2">
          <Label for="term">Term</Label>
          <Input
            type="text"
            id="term"
            bind:value={term}
            placeholder="Term (e.g. Fall, Spring)"
            on:input={handleSearch}
          />
        </div>

        <div class="space-y-2">
          <Label for="year">Year</Label>
          <Input
            type="number"
            id="year"
            bind:value={year}
            placeholder="Year"
            on:input={handleSearch}
          />
        </div>

        <div class="space-y-2">
          <Label for="institution">Institution</Label>
          <Input
            type="text"
            id="institution"
            bind:value={institution}
            placeholder="Institution"
            on:input={handleSearch}
          />
        </div>
      </form>
    </CardContent>
  </Card>

  <section class="space-y-6">
    {#if templates.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each templates as template}
          <div>
            <Card class="w-full">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  <p>
                    {template.institution} - {template.term}
                    {template.year}
                  </p>
                  <p>Created by {template.creator.username}</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="flex justify-between items-center mb-3">
                  <VoteButtons
                    voteCount={template.vote_count}
                    userVote={template.user_vote}
                    creatorId={template.creator.id}
                    templateId={template.id}
                  />

                  <Button
                    variant="default"
                    size="sm"
                    on:click={() => useTemplate(template.id)}
                  >
                    Use Template
                  </Button>
                </div>

                <div class="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => toggleComments(template.id)}
                  >
                    {activeComments === template.id ? "Hide" : "Show"} Comments
                  </Button>
                </div>
              </CardContent>
              {#if activeComments === template.id}
                <CardFooter>
                  <Comments templateId={template.id} />
                </CardFooter>
              {/if}
            </Card>
          </div>
        {/each}
      </div>

      <div class="flex justify-center items-center gap-4">
        <Button
          variant="outline"
          on:click={() => changePage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span class="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          on:click={() => changePage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    {:else}
      <div class="text-center py-10">
        <p class="text-muted-foreground">
          No templates found matching your search.
        </p>
      </div>
    {/if}
  </section>
</main>
