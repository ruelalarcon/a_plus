<script>
  import { Link, navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import Comments from "../components/Comments.svelte";
  import VoteButtons from "../components/VoteButtons.svelte";
  import { query, mutate } from "../lib/graphql/client.js";
  import { CALCULATOR } from "../lib/graphql/queries.js";
  import {
    UPDATE_CALCULATOR,
    DELETE_CALCULATOR,
    CREATE_TEMPLATE,
  } from "../lib/graphql/mutations.js";
  import {
    calculateFinalGrade,
    calculateRequiredGrade,
  } from "../lib/utils/gradeCalculations.js";
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
  import { toast, Toaster } from "svelte-sonner";

  export let id; // Calculator ID from route params

  let calculator = { name: "", id: "", min_desired_grade: null };
  let assessments = [];
  $: finalGrade = calculateFinalGrade(assessments);
  $: requiredGrade = calculateRequiredGrade(
    assessments,
    calculator.min_desired_grade
  );

  let showComments = false;

  onMount(async () => {
    await loadCalculator();
  });

  async function loadCalculator() {
    try {
      const data = await query(CALCULATOR, { id });
      calculator = data.calculator;
      assessments = calculator.assessments || [];
    } catch (error) {
      console.error("Error loading calculator:", error);
      toast.error("Failed to load calculator");
    }
  }

  function addAssessment() {
    assessments = [...assessments, { name: "", weight: "", grade: null }];
  }

  function removeAssessment(index) {
    assessments = assessments.filter((_, i) => i !== index);
  }

  async function saveCalculator() {
    try {
      const data = await mutate(UPDATE_CALCULATOR, {
        id,
        min_desired_grade: calculator.min_desired_grade
          ? parseFloat(calculator.min_desired_grade)
          : null,
        assessments: assessments.map((assessment) => ({
          name: assessment.name,
          weight: parseFloat(assessment.weight),
          grade: assessment.grade ? parseFloat(assessment.grade) : null,
        })),
      });

      calculator = data.updateCalculator;
      assessments = calculator.assessments || [];
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving calculator:", error);
      toast.error("Failed to save changes");
    }
  }

  async function deleteCalculator() {
    if (
      !confirm(
        "Are you sure you want to delete this calculator? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const data = await mutate(DELETE_CALCULATOR, { id });
      if (data.deleteCalculator) {
        navigate("/", { replace: true });
      } else {
        toast.error("Failed to delete calculator");
      }
    } catch (error) {
      console.error("Error deleting calculator:", error);
      toast.error("Failed to delete calculator");
    }
  }

  async function publishTemplate() {
    const name = prompt("Enter a name for your template:", calculator.name);
    if (!name) return;

    const term = prompt("Enter the term (e.g. Fall, Spring):");
    if (!term) return;

    const yearStr = prompt("Enter the year:");
    if (!yearStr) return;
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      toast.error("Please enter a valid year");
      return;
    }

    const institution = prompt("Enter the institution name:");
    if (!institution) return;

    try {
      const data = await mutate(CREATE_TEMPLATE, {
        name,
        term,
        year,
        institution,
        assessments: assessments.map((assessment) => ({
          name: assessment.name,
          weight: parseFloat(assessment.weight),
        })),
      });

      if (data.createTemplate) {
        toast.success("Template published successfully!");
      } else {
        toast.error("Failed to publish template");
      }
    } catch (error) {
      console.error("Error publishing template:", error);
      toast.error("Failed to publish template");
    }
  }

  async function renameCalculator() {
    const newName = prompt(
      "Enter a new name for your calculator:",
      calculator.name
    );
    if (!newName || newName === calculator.name) return;

    try {
      const data = await mutate(UPDATE_CALCULATOR, {
        id,
        name: newName,
      });

      calculator = data.updateCalculator;
      toast.success("Calculator renamed successfully!");
    } catch (error) {
      console.error("Error renaming calculator:", error);
      toast.error("Failed to rename calculator");
    }
  }
</script>

<Toaster />

<main class="container mx-auto px-4 py-8">
  <header
    class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
  >
    <div class="flex items-center gap-4">
      <h1 class="text-3xl font-bold tracking-tight">{calculator.name}</h1>
      <Button variant="outline" size="sm" on:click={renameCalculator}
        >Rename</Button
      >
    </div>
    <div class="flex flex-wrap gap-2">
      <Button variant="default" on:click={publishTemplate}
        >Publish Template</Button
      >
      <Button variant="destructive" on:click={deleteCalculator}
        >Delete Calculator</Button
      >
      <Button variant="outline" asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  </header>

  <div class="space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>Assessments</CardTitle>
        <CardDescription>Add and manage your course assessments</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div
            class="grid grid-cols-4 gap-4 font-medium text-sm text-muted-foreground"
          >
            <span>Assessment Name</span>
            <span>Weight (%)</span>
            <span>Grade (%)</span>
            <span></span>
          </div>
          {#each assessments as assessment, i}
            <div class="grid grid-cols-4 gap-4 items-center">
              <Input
                type="text"
                bind:value={assessment.name}
                placeholder="Assessment name"
              />
              <Input
                type="number"
                bind:value={assessment.weight}
                min="0"
                max="100"
                placeholder="Weight"
              />
              <Input
                type="number"
                bind:value={assessment.grade}
                min="0"
                max="100"
                placeholder="Grade"
              />
              <Button
                variant="ghost"
                size="icon"
                on:click={() => removeAssessment(i)}
              >
                ×
              </Button>
            </div>
          {/each}
          <Button variant="outline" on:click={addAssessment}
            >Add Assessment</Button
          >
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Grade Calculator</CardTitle>
        <CardDescription
          >Set your target grade and see your current progress</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="min-desired-grade">Minimum Desired Grade (%)</Label>
            <Input
              id="min-desired-grade"
              type="number"
              bind:value={calculator.min_desired_grade}
              min="0"
              max="100"
              placeholder="Enter your target grade"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Current Average</Label>
              <div class="text-2xl font-bold">{finalGrade}%</div>
            </div>
            <div class="space-y-2">
              <Label>Required Grade on Remaining</Label>
              <div class="text-2xl font-bold">{requiredGrade}%</div>
            </div>
          </div>

          <Button on:click={saveCalculator}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>

    {#if calculator.template_id}
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription
            >Based on template: {calculator.template?.name ||
              "Unknown Template"}</CardDescription
          >
        </CardHeader>
        <CardContent>
          <div class="flex justify-between items-center mb-3">
            <VoteButtons
              voteCount={calculator.template?.vote_count || 0}
              userVote={calculator.template?.user_vote || 0}
              creatorId={calculator.template?.creator?.id}
              templateId={calculator.template_id}
            />

            <Button
              variant="outline"
              size="sm"
              on:click={() => (showComments = !showComments)}
            >
              {showComments ? "Hide" : "Show"} Comments
            </Button>
          </div>
        </CardContent>
        {#if showComments}
          <CardFooter>
            <Comments templateId={calculator.template_id} />
          </CardFooter>
        {/if}
      </Card>
    {/if}
  </div>
</main>
