<script>
  import { Link } from "svelte-routing";
  import { calculateFinalGrade } from "../lib/utils/gradeCalculations.js";
  import { mutate } from "../lib/graphql/client.js";
  import {
    UPDATE_CALCULATOR,
    DELETE_CALCULATOR,
  } from "../lib/graphql/mutations.js";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";
  import { toast } from "svelte-sonner";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";

  // Icons
  import Calculator from "lucide-svelte/icons/calculator";
  import ExternalLink from "lucide-svelte/icons/external-link";
  import Pencil from "lucide-svelte/icons/pencil";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import AlertCircle from "lucide-svelte/icons/alert-circle";
  import Check from "lucide-svelte/icons/check";

  // Props
  export let calculator;
  export let onDelete = () => {};
  export let onUpdate = () => {};

  // UI state
  let isDialogOpen = false;
  let isDeleting = false;
  let isRenaming = false;

  // Derived values
  $: finalGrade = calculateFinalGrade(calculator.assessments);
  $: assessmentCount = calculator.assessments?.length || 0;
  $: completedAssessments =
    calculator.assessments?.filter((a) => a.grade !== null).length || 0;
  $: completionPercentage =
    assessmentCount > 0 ? (completedAssessments / assessmentCount) * 100 : 0;
  $: isPassingGrade = finalGrade >= (calculator.min_desired_grade || 50);

  /**
   * Prompts the user to rename a calculator
   */
  async function renameCalculator() {
    if (isRenaming) return;

    const newName = prompt(
      "Enter a new name for your calculator:",
      calculator.name
    );
    if (!newName || newName === calculator.name) return;

    isRenaming = true;
    try {
      const data = await mutate(UPDATE_CALCULATOR, {
        id: calculator.id,
        name: newName,
      });

      if (data.updateCalculator) {
        const updatedCalculator = {
          ...calculator,
          name: data.updateCalculator.name,
        };
        calculator = updatedCalculator;
        onUpdate(updatedCalculator);
        toast.success("Calculator renamed successfully");
      }
    } catch (error) {
      console.error("Error renaming calculator:", error);
      toast.error("Failed to rename calculator");
    } finally {
      isRenaming = false;
    }
  }

  /**
   * Confirms and deletes a calculator
   */
  async function confirmDelete() {
    isDialogOpen = true;
  }

  async function deleteCalculator() {
    if (isDeleting) return;

    isDeleting = true;
    try {
      const data = await mutate(DELETE_CALCULATOR, { id: calculator.id });
      if (data.deleteCalculator) {
        toast.success("Calculator deleted successfully");
        onDelete(calculator.id);
      }
    } catch (error) {
      console.error("Error deleting calculator:", error);
      toast.error("Failed to delete calculator");
    } finally {
      isDeleting = false;
      isDialogOpen = false;
    }
  }
</script>

<Card
  class="w-full h-full flex flex-col transition-all duration-200 hover:shadow-md"
  data-test="calculator-card"
  data-calculator-id={calculator.id}
>
  <CardHeader>
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <CardTitle class="text-xl font-bold flex items-center gap-2">
          <Calculator class="h-5 w-5 text-primary" />
          <span data-test="calculator-name">{calculator.name}</span>
        </CardTitle>
        <CardDescription>
          {#if assessmentCount > 0}
            <span data-test="assessment-count"
              >{assessmentCount} assessment{assessmentCount !== 1
                ? "s"
                : ""}</span
            >
          {:else}
            <span data-test="assessment-count">No assessments yet</span>
          {/if}
        </CardDescription>
      </div>
      <div class="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          disabled={isRenaming}
          on:click={renameCalculator}
          aria-label="Rename calculator"
          data-test="rename-calculator-btn"
        >
          <Pencil class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-destructive hover:text-destructive"
          disabled={isDeleting}
          on:click={confirmDelete}
          aria-label="Delete calculator"
          data-test="delete-calculator-btn"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <div class="space-y-4">
      <div>
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm text-muted-foreground">Current Average</span>
          <div class="flex items-center gap-1">
            {#if finalGrade !== 0}
              {#if isPassingGrade}
                <Check class="h-4 w-4 text-green-500" />
              {:else}
                <AlertCircle class="h-4 w-4 text-amber-500" />
              {/if}
            {/if}
            <span class="font-medium text-lg" data-test="final-grade"
              >{finalGrade}%</span
            >
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span data-test="completion-count"
              >Completed: {completedAssessments}/{assessmentCount}</span
            >
            <span data-test="completion-percentage"
              >{Math.round(completionPercentage)}%</span
            >
          </div>
          <Progress
            value={completionPercentage}
            data-test="completion-progress"
          />
        </div>
      </div>
    </div>
  </CardContent>

  <CardFooter class="mt-auto">
    <Link to={`/calculator/${calculator.id}`} class="w-full">
      <Button
        variant="default"
        class="w-full flex items-center gap-1"
        data-test="open-calculator-btn"
      >
        <ExternalLink class="h-3.5 w-3.5" />
        <span>Open Calculator</span>
      </Button>
    </Link>
  </CardFooter>
</Card>

<AlertDialog.Root
  open={isDialogOpen}
  onOpenChange={(open) => (isDialogOpen = open)}
  data-test="delete-dialog"
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Calculator</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete "{calculator.name}"? This action cannot
        be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={isDeleting} data-test="cancel-delete-btn"
        >Cancel</AlertDialog.Cancel
      >
      <AlertDialog.Action
        on:click={deleteCalculator}
        disabled={isDeleting}
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        data-test="confirm-delete-btn"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
