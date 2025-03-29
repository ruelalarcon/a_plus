<script>
  import { Link } from "svelte-routing";
  import { navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import { calculateFinalGrade } from "../lib/utils/gradeCalculations.js";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { query, mutate } from "../lib/graphql/client.js";
  import { MY_CALCULATORS } from "../lib/graphql/queries.js";
  import {
    CREATE_CALCULATOR,
    UPDATE_CALCULATOR,
    DELETE_CALCULATOR,
  } from "../lib/graphql/mutations.js";

  let calculators = [];

  onMount(async () => {
    await loadCalculators();
  });

  async function loadCalculators() {
    try {
      const data = await query(MY_CALCULATORS);
      calculators = data.myCalculators;
    } catch (error) {
      console.error("Error loading calculators:", error);
    }
  }

  async function createNewCalculator() {
    const name = prompt("Enter a name for your new calculator:");
    if (!name) return;

    try {
      const data = await mutate(CREATE_CALCULATOR, { name });
      navigate(`/calculator/${data.createCalculator.id}`);
    } catch (error) {
      console.error("Error creating calculator:", error);
      alert("Failed to create calculator");
    }
  }

  async function deleteCalculator(id, name) {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const data = await mutate(DELETE_CALCULATOR, { id });
      if (data.deleteCalculator) {
        calculators = calculators.filter((calc) => calc.id !== id);
      }
    } catch (error) {
      console.error("Error deleting calculator:", error);
      alert("Failed to delete calculator");
    }
  }

  async function renameCalculator(calculator) {
    const newName = prompt(
      "Enter a new name for your calculator:",
      calculator.name
    );
    if (!newName || newName === calculator.name) return;

    try {
      const data = await mutate(UPDATE_CALCULATOR, {
        id: calculator.id,
        name: newName,
      });
      calculators = calculators.map((calc) =>
        calc.id === calculator.id ? data.updateCalculator : calc
      );
    } catch (error) {
      console.error("Error renaming calculator:", error);
      alert("Failed to rename calculator");
    }
  }
</script>

<section class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-3xl font-bold tracking-tight">Your Grade Calculators</h2>
  </div>

  {#if calculators.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each calculators as calc}
        <div>
          <Card class="w-full">
            <CardHeader>
              <CardTitle>{calc.name}</CardTitle>
              <CardDescription
                >Current Average: {calculateFinalGrade(
                  calc.assessments
                )}%</CardDescription
              >
            </CardHeader>
            <CardContent>
              <div class="flex justify-between items-center w-full">
                <Button variant="default" class="w-full" asChild>
                  <Link to={`/calculator/${calc.id}`}>Open Calculator</Link>
                </Button>
                <div class="flex gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => renameCalculator(calc)}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    on:click={() => deleteCalculator(calc.id, calc.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-10">
      <p class="text-muted-foreground">No calculators yet.</p>
    </div>
  {/if}

  <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 justify-center">
    <Button on:click={createNewCalculator}>Create New Calculator</Button>
    <Button variant="outline" asChild>
      <Link to="/search">Search Templates</Link>
    </Button>
  </div>
</section>
