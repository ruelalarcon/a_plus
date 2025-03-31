<script>
  import { username, userId } from "../lib/stores.js";
  import { Link } from "svelte-routing";
  import { navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Card from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { query, mutate } from "../lib/graphql/client.js";
  import { USER_CALCULATORS } from "../lib/graphql/queries.js";
  import { CREATE_CALCULATOR } from "../lib/graphql/mutations.js";
  import { toast } from "svelte-sonner";
  import CalculatorCard from "../components/CalculatorCard.svelte";
  import { calculateFinalGrade } from "../lib/utils/gradeCalculations.js";

  // Icons
  import Calculator from "lucide-svelte/icons/calculator";
  import Search from "lucide-svelte/icons/search";
  import Plus from "lucide-svelte/icons/plus";
  import Target from "lucide-svelte/icons/target";

  let calculators = [];
  let searchQuery = "";
  let newCalculatorName = "";
  let createDialogOpen = false;
  let activeTab = "all";

  onMount(async () => {
    if ($userId) {
      await loadCalculators();
    }
  });

  async function loadCalculators() {
    try {
      const data = await query(USER_CALCULATORS, { userId: $userId });
      calculators = data.user.calculators;
    } catch (error) {
      console.error("Error loading calculators:", error);
      toast.error("Failed to load calculators");
    }
  }

  async function createNewCalculator() {
    if (!newCalculatorName) {
      toast.error("Please enter a calculator name");
      return;
    }

    try {
      const data = await mutate(CREATE_CALCULATOR, { name: newCalculatorName });
      if (data.createCalculator) {
        toast.success("Calculator created successfully");

        // Close dialog before navigation
        createDialogOpen = false;
        // Reset form state
        newCalculatorName = "";

        // Get new calculator ID
        const newCalculatorId = data.createCalculator.id;

        // Use window.location to ensure proper navigation
        window.location.href = `/calculator/${newCalculatorId}`;
      }
    } catch (error) {
      console.error("Error creating calculator:", error);
      toast.error("Failed to create calculator");
    }
  }

  function openCreateDialog() {
    createDialogOpen = true;
  }

  // Handle Enter key in calculator name input
  function handleKeydown(e) {
    if (e.key === "Enter" && newCalculatorName.trim()) {
      e.preventDefault();
      createNewCalculator();
    }
  }

  function handleCalculatorDelete(id) {
    calculators = calculators.filter((calc) => calc.id !== id);
  }

  function handleCalculatorUpdate(updatedCalculator) {
    calculators = calculators.map((calc) =>
      calc.id === updatedCalculator.id ? updatedCalculator : calc
    );
  }

  // Helper function to get numeric grade from calculator
  function getCalculatorGrade(calculator) {
    const grade = calculateFinalGrade(calculator.assessments || []);
    // If there are no assessments or no grades entered, grade will be "N/A"
    return grade === "N/A" ? 0 : parseFloat(grade);
  }

  // Filter calculators based on search and tab
  $: filteredCalculators = calculators.filter((calculator) => {
    // Get the calculator's current grade
    const currentGrade = getCalculatorGrade(calculator);
    const targetGrade = calculator.min_desired_grade || 50;

    // Filter by tab
    if (activeTab === "meeting_goal" && currentGrade < targetGrade)
      return false;
    if (activeTab === "below_target" && currentGrade >= targetGrade)
      return false;

    // Filter by search
    if (searchQuery) {
      return calculator.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Computed stats
  $: totalAssessments = calculators.reduce(
    (sum, calc) => sum + (calc.assessments?.length || 0),
    0
  );

  $: meetingGoalCount = calculators.filter((calc) => {
    const currentGrade = getCalculatorGrade(calc);
    const targetGrade = calc.min_desired_grade || 50;
    return currentGrade >= targetGrade;
  }).length;
</script>

<div class="bg-muted/40 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator class="h-8 w-8 text-primary" />
            Grade Calculators
          </h1>
          <p class="text-muted-foreground">
            Welcome back, <strong>{$username}</strong>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Total Calculators</p>
              <p class="text-2xl font-bold">{calculators.length}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Meeting Goal</p>
              <p class="text-2xl font-bold">{meetingGoalCount}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">Total Assessments</p>
              <p class="text-2xl font-bold">{totalAssessments}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Sidebar with Create Calculator Form and Actions -->
      <div class="md:col-span-1">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Plus class="h-5 w-5" />
              Create Calculator
            </Card.Title>
            <Card.Description
              >Start tracking your course grades</Card.Description
            >
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-muted-foreground mb-4">
                  Create a new calculator to track your grades for a course. You
                  can add assessments, set weights, and monitor your progress.
                </p>
              </div>
            </div>
          </Card.Content>
          <Card.Footer>
            <Button on:click={openCreateDialog} class="w-full">
              <Plus class="h-4 w-4 mr-2" />
              Create New Calculator
            </Button>
          </Card.Footer>
        </Card.Root>

        <div class="mt-6">
          <Card.Root>
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <Search class="h-5 w-5" />
                Browse Templates
              </Card.Title>
              <Card.Description>
                Use community templates to get started quickly
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div class="space-y-4">
                <div>
                  <p class="text-sm text-muted-foreground mb-4">
                    Browse the template library to find pre-configured
                    calculators for popular courses and institutions.
                  </p>
                </div>
              </div>
            </Card.Content>
            <Card.Footer>
              <Link to="/search" class="w-full">
                <Button variant="outline" class="w-full">
                  <Search class="h-4 w-4 mr-2" />
                  Search Templates
                </Button>
              </Link>
            </Card.Footer>
          </Card.Root>
        </div>
      </div>

      <!-- Main Calculator List -->
      <div class="md:col-span-2">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <Tabs.Root bind:value={activeTab} class="w-full">
            <Tabs.List class="w-full sm:w-auto">
              <Tabs.Trigger value="all">All Calculators</Tabs.Trigger>
              <Tabs.Trigger value="meeting_goal">Meeting Goal</Tabs.Trigger>
              <Tabs.Trigger value="below_target">Below Target</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          <div class="relative w-full sm:w-80">
            <Search
              class="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4"
            />
            <Input
              type="search"
              placeholder="Search calculators..."
              class="pl-8 w-full"
              bind:value={searchQuery}
            />
          </div>
        </div>

        {#if filteredCalculators.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each filteredCalculators as calculator}
              <CalculatorCard
                {calculator}
                onDelete={handleCalculatorDelete}
                onUpdate={handleCalculatorUpdate}
              />
            {/each}
          </div>
        {:else}
          <div class="text-center py-12 bg-background rounded-lg border">
            <Target class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {#if searchQuery}
              <p class="text-muted-foreground">
                No calculators match your search.
              </p>
            {:else if activeTab === "meeting_goal"}
              <p class="text-muted-foreground">
                No calculators are meeting their target grade.
              </p>
            {:else if activeTab === "below_target"}
              <p class="text-muted-foreground">
                No calculators are below their target grade.
              </p>
            {:else}
              <p class="text-muted-foreground">
                No calculators yet. Create your first calculator to get started!
              </p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Create Calculator Dialog -->
<AlertDialog.Root
  open={createDialogOpen}
  onOpenChange={(open) => (createDialogOpen = open)}
>
  <AlertDialog.Content>
    <form on:submit|preventDefault={createNewCalculator}>
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
          on:keydown={handleKeydown}
          autofocus
        />
      </div>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action type="submit">Create</AlertDialog.Action>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>
