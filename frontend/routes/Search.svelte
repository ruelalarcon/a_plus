<script>
  import debounce from "lodash/debounce";
  import { query } from "../lib/graphql/client.js";
  import { ALL_TEMPLATES } from "../lib/graphql/queries.js";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { toast } from "svelte-sonner";
  import TemplateCard from "../components/TemplateCard.svelte";

  // Icons
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Search from "lucide-svelte/icons/search";
  import CalendarDays from "lucide-svelte/icons/calendar-days";
  import Building from "lucide-svelte/icons/building";
  import Filter from "lucide-svelte/icons/filter";
  import FilePlus from "lucide-svelte/icons/file-plus";

  let searchQuery = "";
  let term = "";
  let year = "";
  let institution = "";
  let templates = [];
  let currentPage = 1;
  let totalPages = 1;
  let totalResults = 0;
  let isLoading = false;
  const ITEMS_PER_PAGE = 10;

  const debouncedSearch = debounce(async () => {
    try {
      isLoading = true;
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
      toast.error("Failed to search templates");
    } finally {
      isLoading = false;
    }
  }, 300);

  function handleSearch() {
    currentPage = 1; // Reset to first page on new search
    debouncedSearch();
  }

  function changePage(newPage) {
    currentPage = newPage;
    debouncedSearch();
    // Scroll to top of results
    const resultSection = document.getElementById("search-results");
    if (resultSection) {
      resultSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleTemplateDelete(templateId) {
    templates = templates.filter((t) => t.id !== templateId);
    if (templates.length === 0 && totalResults > 0) {
      totalResults--;
      totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
      // If we're on a page that no longer exists, go back to the last page
      if (currentPage > totalPages && totalPages > 0) {
        changePage(totalPages);
      } else {
        // Otherwise, refresh the current page
        debouncedSearch();
      }
    }
  }

  function clearFilters() {
    searchQuery = "";
    term = "";
    year = "";
    institution = "";
    handleSearch();
  }

  // Initial search on mount
  debouncedSearch();
</script>

<div class="bg-muted/40 min-h-screen" data-test="search-page">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1
            class="text-3xl font-bold tracking-tight flex items-center gap-2"
            data-test="page-title"
          >
            <Search class="h-8 w-8 text-primary" />
            Template Library
          </h1>
          <p class="text-muted-foreground">
            Find the perfect grade calculator template for your courses
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Found</p>
              <p class="text-2xl font-bold" data-test="total-results">
                {totalResults}
              </p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Pages</p>
              <p class="text-2xl font-bold" data-test="total-pages">
                {totalPages}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="mb-8">
      <Card.Root data-test="search-filters">
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Filter class="h-5 w-5" />
            Search Filters
          </Card.Title>
          <Card.Description>
            Narrow down templates by name, term, year, or institution
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            on:submit|preventDefault={handleSearch}
            data-test="search-form"
          >
            <div class="space-y-2">
              <Label for="search-query" class="flex items-center gap-2">
                <Search class="h-4 w-4" />
                <span>Search Templates</span>
              </Label>
              <Input
                type="search"
                id="search-query"
                bind:value={searchQuery}
                placeholder="Search by name..."
                on:input={handleSearch}
                data-test="search-input"
              />
            </div>

            <div class="space-y-2">
              <Label for="term" class="flex items-center gap-2">
                <CalendarDays class="h-4 w-4" />
                <span>Term</span>
              </Label>
              <Input
                type="text"
                id="term"
                bind:value={term}
                placeholder="Term (e.g. Fall, Spring)"
                on:input={handleSearch}
                data-test="term-input"
              />
            </div>

            <div class="space-y-2">
              <Label for="year" class="flex items-center gap-2">
                <CalendarDays class="h-4 w-4" />
                <span>Year</span>
              </Label>
              <Input
                type="number"
                id="year"
                bind:value={year}
                placeholder="Year"
                on:input={handleSearch}
                data-test="year-input"
              />
            </div>

            <div class="space-y-2">
              <Label for="institution" class="flex items-center gap-2">
                <Building class="h-4 w-4" />
                <span>Institution</span>
              </Label>
              <Input
                type="text"
                id="institution"
                bind:value={institution}
                placeholder="Institution"
                on:input={handleSearch}
                data-test="institution-input"
              />
            </div>
          </form>
        </Card.Content>
        <Card.Footer class="flex justify-between">
          <Button
            variant="outline"
            on:click={clearFilters}
            data-test="clear-filters-btn"
          >
            Clear Filters
          </Button>
          <Button on:click={handleSearch} data-test="search-btn">
            <Search class="h-4 w-4 mr-2" />
            <span>Search</span>
          </Button>
        </Card.Footer>
      </Card.Root>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold" id="search-results">Results</h2>
      <div class="flex items-center gap-2">
        {#if totalResults > 0}
          <Badge variant="outline" data-test="results-count">
            Showing {templates.length} of {totalResults} templates
          </Badge>
        {/if}
      </div>
    </div>

    <section class="space-y-6" data-test="results-section">
      {#if isLoading}
        <div
          class="text-center py-10 bg-background rounded-lg border"
          data-test="loading-state"
        >
          <div class="animate-pulse flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-muted mb-4"></div>
            <div class="h-4 w-32 bg-muted rounded mb-4"></div>
            <div class="h-3 w-40 bg-muted rounded"></div>
          </div>
        </div>
      {:else if templates.length > 0}
        <div
          class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-6"
          data-test="templates-grid"
        >
          {#each templates as template}
            <TemplateCard {template} onDelete={handleTemplateDelete} />
          {/each}
        </div>

        <div
          class="flex justify-center items-center gap-4 py-4"
          data-test="pagination"
        >
          <Button
            variant="outline"
            class="flex items-center gap-1"
            on:click={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            data-test="prev-page-btn"
          >
            <ChevronLeft class="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div
            class="px-4 py-2 rounded-md bg-background border"
            data-test="page-indicator"
          >
            <span class="font-medium">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            class="flex items-center gap-1"
            on:click={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            data-test="next-page-btn"
          >
            <span>Next</span>
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      {:else}
        <div
          class="text-center py-16 bg-background rounded-lg border"
          data-test="empty-results"
        >
          <FilePlus class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          {#if searchQuery || term || year || institution}
            <p class="text-lg font-medium mb-2">No matching templates found</p>
            <p class="text-muted-foreground">
              Try adjusting your search filters or clear them to see all
              templates.
            </p>
            <Button
              variant="outline"
              class="mt-4"
              on:click={clearFilters}
              data-test="clear-filters-empty-btn"
            >
              Clear All Filters
            </Button>
          {:else}
            <p class="text-lg font-medium mb-2">No templates available</p>
            <p class="text-muted-foreground">
              Please check back later or create your own template.
            </p>
          {/if}
        </div>
      {/if}
    </section>
  </div>
</div>
