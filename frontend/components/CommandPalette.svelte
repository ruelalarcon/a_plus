<script>
  import * as Command from "$lib/components/ui/command";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import { toast } from "svelte-sonner";
  import { userId } from "../lib/stores.js";
  import { Badge } from "$lib/components/ui/badge";

  // Icons
  import Calculator from "lucide-svelte/icons/calculator";
  import BookOpen from "lucide-svelte/icons/book-open";
  import Search from "lucide-svelte/icons/search";
  import Plus from "lucide-svelte/icons/plus";
  import FolderOpen from "lucide-svelte/icons/folder-open";

  // For calculator creation
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { mutate, query } from "../lib/graphql/client.js";
  import { USER_CALCULATORS, USER_COURSES } from "../lib/graphql/queries.js";
  import {
    CREATE_CALCULATOR,
    CREATE_COURSE,
  } from "../lib/graphql/mutations.js";

  export let open = false;

  // State for calculator creation
  let createDialogOpen = false;
  let newCalculatorName = "";
  let isCreating = false;
  let calculatorInputEl;

  // State for calculator opening
  let openCalculatorDialogOpen = false;
  let calculators = [];
  let isLoadingCalculators = false;
  let calculatorsLoaded = false;
  let calculatorSearchQuery = "";

  // State for course creation
  let createCourseDialogOpen = false;
  let newCourseName = "";
  let newCourseCredits = 3.0;
  let selectedPrereqs = [];
  let isCreatingCourse = false;
  let courseNameInputEl;
  let availableCourses = [];
  let isLoadingCourses = false;

  // State for template search
  let searchTemplateDialogOpen = false;
  let templateSearchQuery = "";
  let templateSearchInputEl;

  onMount(() => {
    // Preload calculators data when component mounts
    if ($userId) {
      loadCalculators();
    }

    // Periodically refresh calculator data in the background (every 2 minutes)
    const refreshInterval = setInterval(() => {
      if ($userId && !openCalculatorDialogOpen) {
        loadCalculators();
      }
    }, 120000);

    function handleKeydown(e) {
      // Command Palette toggle (Ctrl+K)
      if (
        e.key === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        open = !open;
        return;
      }

      // Direct command shortcuts (all Alt combinations)
      // Alt is less likely to conflict with browser shortcuts
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        // Don't trigger shortcuts when in an input field
        // if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        //   return;
        // }
        // We actually want to trigger shortcuts when in an input field since fields may autofocus,
        // And as long as we use alt keybinds, we shouldn't cause conflicts when typing.

        switch (e.key.toLowerCase()) {
          case "c": // Create Calculator (Alt+C)
            e.preventDefault();
            handleCreateCalculator();
            break;

          case "o": // Open Calculator (Alt+O)
            e.preventDefault();
            handleOpenCalculator();
            break;

          case "a": // Add Course (Alt+A)
            e.preventDefault();
            handleAddCourse();
            break;

          case "s": // Search Templates (Alt+S)
            e.preventDefault();
            handleSearchTemplates();
            break;
        }
      }
    }

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      clearInterval(refreshInterval);
    };
  });

  function handleCreateCalculator() {
    open = false;
    createDialogOpen = true;
    // Focus input on next tick after dialog opens
    setTimeout(() => {
      if (calculatorInputEl) {
        calculatorInputEl.focus();
      }
    }, 50);
  }

  async function handleOpenCalculator() {
    // First start a fetch in the background before opening dialog
    const fetchPromise = refreshCalculatorsInBackground();

    // Immediately open dialog with existing data
    open = false;
    calculatorSearchQuery = ""; // Reset search
    openCalculatorDialogOpen = true;

    // After a slight delay (500ms) to let the animation complete,
    // check if we should update the UI with new data
    setTimeout(async () => {
      if (openCalculatorDialogOpen) {
        // Wait for the fetch to complete if it hasn't already
        await fetchPromise;
      }
    }, 500);
  }

  // Returns a promise that resolves when calculators are loaded
  function refreshCalculatorsInBackground() {
    return new Promise((resolve) => {
      loadCalculators().then(resolve).catch(resolve);
    });
  }

  // Called when the dialog is closed
  function handleCalculatorDialogClose(isOpen) {
    openCalculatorDialogOpen = isOpen;

    // Only refresh data when dialog is closed
    if (!isOpen) {
      setTimeout(() => {
        loadCalculators();
      }, 300); // Delay to ensure closing animation completes first
    }
  }

  async function loadCalculators() {
    if (isLoadingCalculators) return;

    isLoadingCalculators = true;
    try {
      const data = await query(USER_CALCULATORS, { userId: $userId });
      calculators = data.user.calculators;
      calculatorsLoaded = true;
    } catch (error) {
      console.error("Error loading calculators:", error);
      // Only show error toast if dialog is closed to avoid interrupting the experience
      if (!openCalculatorDialogOpen) {
        toast.error("Failed to load calculators");
      }
    } finally {
      isLoadingCalculators = false;
    }
  }

  function openCalculator(calculator) {
    openCalculatorDialogOpen = false;

    // Force navigation using window.location when on a calculator page
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/calculator/")) {
      window.location.href = `/calculator/${calculator.id}`;
    } else {
      // Use regular navigation for other pages
      navigate(`/calculator/${calculator.id}`);
    }
  }

  async function handleAddCourse() {
    open = false;
    createCourseDialogOpen = true;

    // Reset form values
    newCourseName = "";
    newCourseCredits = 3.0;
    selectedPrereqs = [];

    // Load existing courses for prerequisites
    await loadCourses();

    // Focus input on next tick after dialog opens
    setTimeout(() => {
      if (courseNameInputEl) {
        courseNameInputEl.focus();
      }
    }, 50);
  }

  async function loadCourses() {
    isLoadingCourses = true;
    try {
      const data = await query(USER_COURSES, { userId: $userId });
      availableCourses = data.user.courses;
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
    } finally {
      isLoadingCourses = false;
    }
  }

  async function createNewCourse(e) {
    // Prevent default form submission
    if (e) e.preventDefault();

    if (!newCourseName || newCourseName.trim() === "") {
      toast.error("Please enter a course name");
      return;
    }

    // Set loading state
    isCreatingCourse = true;

    try {
      const result = await mutate(CREATE_COURSE, {
        name: newCourseName,
        credits: parseFloat(newCourseCredits),
        prerequisiteIds: selectedPrereqs.length > 0 ? selectedPrereqs : null,
      });

      if (result && result.createCourse) {
        toast.success("Course added successfully");

        // Close dialog before navigation
        createCourseDialogOpen = false;

        // Navigate to courses page
        navigate("/courses");
      } else {
        console.error("Invalid response format:", result);
        toast.error("Failed to add course");
      }
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course");
    } finally {
      isCreatingCourse = false;
    }
  }

  // Handle Enter key in course name input
  function handleCourseNameKeydown(e) {
    if (e.key === "Enter" && !isCreatingCourse && newCourseName.trim()) {
      e.preventDefault();
      createNewCourse();
    }
  }

  function handleSearchTemplates(query = "") {
    open = false;
    searchTemplateDialogOpen = true;
    templateSearchQuery = query;

    // Focus input on next tick after dialog opens
    setTimeout(() => {
      if (templateSearchInputEl) {
        templateSearchInputEl.focus();
      }
    }, 50);
  }

  function executeTemplateSearch() {
    // Close dialog before navigation
    searchTemplateDialogOpen = false;

    // Navigate to search page with query
    navigate("/search");

    // Set search field value after navigation
    setTimeout(() => {
      const searchInput = document.getElementById("search-query");
      if (searchInput) {
        searchInput.focus();
        searchInput.value = templateSearchQuery;
        // Trigger input event to start search
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, 100);
  }

  // Handle Enter key in template search input
  function handleTemplateSearchKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      executeTemplateSearch();
    }
  }

  async function createNewCalculator(e) {
    // Prevent default form submission
    if (e) e.preventDefault();

    if (!newCalculatorName) {
      toast.error("Please enter a calculator name");
      return;
    }

    // Set loading state
    isCreating = true;

    try {
      const result = await mutate(CREATE_CALCULATOR, {
        name: newCalculatorName,
        minDesiredGrade: null,
      });

      if (result && result.createCalculator) {
        toast.success("Calculator created successfully");
        // Close dialog before navigation
        createDialogOpen = false;
        // Reset form
        newCalculatorName = "";

        // Get new calculator ID
        const newCalculatorId = result.createCalculator.id;

        // Force navigation using window.location when on a calculator page
        const currentPath = window.location.pathname;
        if (currentPath.startsWith("/calculator/")) {
          window.location.href = `/calculator/${newCalculatorId}`;
        } else {
          // Use regular navigation for other pages
          navigate(`/calculator/${newCalculatorId}`);
        }
      } else {
        toast.error("Failed to create calculator");
        console.error("Invalid response format:", result);
      }
    } catch (error) {
      console.error("Error creating calculator:", error);
      toast.error(error.message || "Failed to create calculator");
    } finally {
      isCreating = false;
    }
  }

  // Handle Enter key in calculator name input
  function handleKeydown(e) {
    if (e.key === "Enter" && !isCreating && newCalculatorName.trim()) {
      e.preventDefault();
      createNewCalculator();
    }
  }

  // Input state management
  let searchValue = "";
</script>

<Command.Dialog bind:open>
  <Command.Input
    placeholder="Type a command or search..."
    bind:value={searchValue}
  />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>
    <Command.Group heading="Actions">
      <Command.Item onSelect={handleCreateCalculator} value="create calculator">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            <span>Create Calculator</span>
          </div>
          <Badge variant="outline" class="ml-2">Alt+C</Badge>
        </div>
      </Command.Item>
      <Command.Item onSelect={handleOpenCalculator} value="open calculator">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <FolderOpen class="h-4 w-4" />
            <span>Open Calculator</span>
          </div>
          <Badge variant="outline" class="ml-2">Alt+O</Badge>
        </div>
      </Command.Item>
      <Command.Item onSelect={handleAddCourse} value="add course">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <BookOpen class="h-4 w-4" />
            <span>Add Course</span>
          </div>
          <Badge variant="outline" class="ml-2">Alt+A</Badge>
        </div>
      </Command.Item>
      <Command.Item
        onSelect={() => handleSearchTemplates(searchValue)}
        value="search templates"
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <Search class="h-4 w-4" />
            <span>Search Templates</span>
          </div>
          <Badge variant="outline" class="ml-2">Alt+S</Badge>
        </div>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>

<!-- Open Calculator Dialog -->
<Command.Dialog
  open={openCalculatorDialogOpen}
  onOpenChange={handleCalculatorDialogClose}
>
  <Command.Input
    placeholder="Search calculators..."
    bind:value={calculatorSearchQuery}
  />
  <Command.List>
    <Command.Empty>
      {#if isLoadingCalculators && !calculatorsLoaded}
        <div class="p-2 text-center">Loading calculators...</div>
      {:else}
        <div class="p-2 text-center">No calculators found</div>
      {/if}
    </Command.Empty>

    <Command.Group heading="Your Calculators">
      {#if isLoadingCalculators && !calculatorsLoaded}
        <div class="p-2 text-center">Loading calculators...</div>
      {:else}
        {#each calculators as calculator}
          <Command.Item
            value={calculator.name}
            onSelect={() => openCalculator(calculator)}
          >
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <Calculator class="h-4 w-4" />
                <span>{calculator.name}</span>
              </div>

              {#if calculator.min_desired_grade}
                <span class="text-xs text-muted-foreground">
                  Target: {calculator.min_desired_grade}%
                </span>
              {/if}
            </div>
          </Command.Item>
        {/each}
      {/if}
    </Command.Group>
  </Command.List>
</Command.Dialog>

<!-- Create Calculator Dialog -->
<AlertDialog.Root
  open={createDialogOpen}
  onOpenChange={(open) => (createDialogOpen = open)}
>
  <AlertDialog.Content>
    <form on:submit={createNewCalculator}>
      <AlertDialog.Header>
        <AlertDialog.Title>Create New Calculator</AlertDialog.Title>
        <AlertDialog.Description>
          Enter a name for your new calculator.
        </AlertDialog.Description>
      </AlertDialog.Header>
      <div class="py-4">
        <Input
          type="text"
          placeholder="Enter calculator name"
          bind:value={newCalculatorName}
          class="w-full"
          bind:this={calculatorInputEl}
          on:keydown={handleKeydown}
          autofocus
        />
      </div>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create"}
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Create Course Dialog -->
<AlertDialog.Root
  open={createCourseDialogOpen}
  onOpenChange={(open) => (createCourseDialogOpen = open)}
>
  <AlertDialog.Content class="max-w-md">
    <form on:submit={createNewCourse}>
      <AlertDialog.Header>
        <AlertDialog.Title>Add New Course</AlertDialog.Title>
        <AlertDialog.Description>
          Enter course details to add to your planner.
        </AlertDialog.Description>
      </AlertDialog.Header>
      <div class="py-4 space-y-4">
        <div class="space-y-2">
          <Label for="new-course-name">Course Name</Label>
          <Input
            id="new-course-name"
            type="text"
            placeholder="Enter course name"
            bind:value={newCourseName}
            bind:this={courseNameInputEl}
            on:keydown={handleCourseNameKeydown}
            class="w-full"
            autofocus
          />
        </div>

        <div class="space-y-2">
          <Label for="new-course-credits">Credits</Label>
          <Input
            id="new-course-credits"
            type="number"
            placeholder="Enter credit amount"
            bind:value={newCourseCredits}
            min="0"
            step="0.5"
            class="w-full"
          />
        </div>

        {#if availableCourses.length > 0}
          <div class="space-y-2">
            <Label>Prerequisites</Label>
            {#if isLoadingCourses}
              <div class="p-2 text-center">Loading courses...</div>
            {:else}
              <div
                class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-2"
              >
                {#each availableCourses as course}
                  <div class="flex items-center space-x-2">
                    <Checkbox
                      id={`cmd-prereq-${course.id}`}
                      checked={selectedPrereqs.includes(course.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectedPrereqs = [...selectedPrereqs, course.id];
                        } else {
                          selectedPrereqs = selectedPrereqs.filter(
                            (id) => id !== course.id
                          );
                        }
                      }}
                    />
                    <Label
                      for={`cmd-prereq-${course.id}`}
                      class="cursor-pointer"
                    >
                      {course.name}
                    </Label>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action type="submit" disabled={isCreatingCourse}>
          {isCreatingCourse ? "Adding..." : "Add Course"}
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Search Templates Dialog -->
<AlertDialog.Root
  open={searchTemplateDialogOpen}
  onOpenChange={(open) => (searchTemplateDialogOpen = open)}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Search Templates</AlertDialog.Title>
      <AlertDialog.Description>
        Enter a search term to find calculator templates.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <div class="py-4">
      <Input
        type="text"
        placeholder="Search by name..."
        bind:value={templateSearchQuery}
        class="w-full"
        bind:this={templateSearchInputEl}
        on:keydown={handleTemplateSearchKeydown}
        autofocus
      />
    </div>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action on:click={executeTemplateSearch}>
        Search
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
