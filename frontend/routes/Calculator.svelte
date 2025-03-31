<script>
  import { Link, navigate, useLocation } from "svelte-routing";
  import { onMount } from "svelte";
  import { openCommentsModal } from "../components/CommentsModal.svelte";
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
  import * as Card from "$lib/components/ui/card";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Progress } from "$lib/components/ui/progress";
  import { Separator } from "$lib/components/ui/separator";
  import { toast } from "svelte-sonner";
  import { Badge } from "$lib/components/ui/badge";

  // Icons
  import MessageSquare from "lucide-svelte/icons/message-square";
  import Calculator from "lucide-svelte/icons/calculator";
  import Plus from "lucide-svelte/icons/plus";
  import Save from "lucide-svelte/icons/save";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import FileUp from "lucide-svelte/icons/file-up";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import Pencil from "lucide-svelte/icons/pencil";
  import Target from "lucide-svelte/icons/target";
  import BookOpen from "lucide-svelte/icons/book-open";
  import Gauge from "lucide-svelte/icons/gauge";
  import XCircle from "lucide-svelte/icons/x-circle";
  import ChevronUp from "lucide-svelte/icons/chevron-up";
  import ChevronDown from "lucide-svelte/icons/chevron-down";

  export let id; // Calculator ID from route params

  // Get current location to check if we're on this calculator page
  const location = useLocation();

  let calculator = { name: "", id: "", min_desired_grade: null };
  let assessments = [];
  let editingName = false;
  let newName = "";
  let deleteDialogOpen = false;
  let publishDialogOpen = false;
  let publishDetails = {
    name: "",
    term: "",
    year: "",
    institution: "",
  };
  let isSaving = false;
  let isAutoSaving = false;
  let hasUnsavedChanges = false;
  let unsavedChangesDialogOpen = false;
  let pendingNavigation = null;
  let initialCalculatorState = null;

  // Reactive values
  $: finalGrade = calculateFinalGrade(assessments);
  $: requiredGrade = calculateRequiredGrade(
    assessments,
    calculator.min_desired_grade
  );
  $: completedAssessments = assessments.filter(
    (a) => a.grade !== null && a.grade !== ""
  ).length;
  $: completionPercentage =
    assessments.length > 0
      ? (completedAssessments / assessments.length) * 100
      : 0;
  $: isPassingGrade =
    finalGrade !== "N/A" &&
    parseFloat(finalGrade) >= (calculator.min_desired_grade || 50);
  $: isTargetPossible =
    requiredGrade !== "N/A" && parseFloat(requiredGrade) <= 100;
  $: totalWeight = assessments.reduce(
    (sum, a) => sum + (parseFloat(a.weight) || 0),
    0
  );
  $: weightWarning = totalWeight !== 100 && assessments.length > 0;

  // Add isMobile flag
  let isMobile = false;

  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }

  // Improved keyboard handler - now checks for mobile
  function handleKeydown(e) {
    // Don't process keyboard shortcuts on mobile
    if (isMobile) return;

    // First check if we're on the calculator page still
    if (!$location.pathname.startsWith(`/calculator/${id}`)) {
      // Not on this calculator's page - don't handle shortcuts
      return;
    }

    // Exit if we're in an input or textarea to avoid interfering with normal typing
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      // Allow Ctrl+S in all form fields only on this calculator page
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        saveCalculator();
      }
      return;
    }

    // Alt+N to create a new assessment
    if (
      e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey &&
      e.key.toLowerCase() === "n"
    ) {
      e.preventDefault();
      handleAddAssessment();
    }

    // Ctrl+S to save changes
    if (
      (e.ctrlKey || e.metaKey) &&
      !e.altKey &&
      !e.shiftKey &&
      e.key.toLowerCase() === "s"
    ) {
      e.preventDefault();
      saveCalculator();
    }
  }

  // Keep track of whether the component is mounted
  let isMounted = false;

  onMount(async () => {
    isMounted = true;
    await loadCalculator();

    // Check if mobile device
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Handle navigation events to detect leaving with unsaved changes
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Add keyboard event listener
    document.addEventListener("keydown", handleKeydown);

    // Remove event listeners on component unmount
    return () => {
      isMounted = false;
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("resize", checkMobile);
    };
  });

  // Handle beforeunload event
  function handleBeforeUnload(e) {
    if (hasUnsavedChanges) {
      e.preventDefault();
      // Standard message for unsaved changes (browser-specific)
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    }
  }

  // Override navigation with confirmation when there are unsaved changes
  function handleNavigate(href) {
    if (hasUnsavedChanges) {
      pendingNavigation = href;
      unsavedChangesDialogOpen = true;
    } else {
      navigate(href);
    }
  }

  // Track changes to assessments and calculator properties
  $: {
    if (initialCalculatorState) {
      // Only mark as changed if something actually changed from initial state
      const minGradeChanged =
        calculator.min_desired_grade !==
        initialCalculatorState.min_desired_grade;

      // Check if assessments have changed in number, order, or values
      const assessmentsChanged =
        assessments.length !== initialCalculatorState.assessments.length ||
        assessments.some((assessment, index) => {
          const initialAssessment = initialCalculatorState.assessments[index];
          if (!initialAssessment) return true;
          return (
            assessment.name !== initialAssessment.name ||
            assessment.weight !== initialAssessment.weight ||
            assessment.grade !== initialAssessment.grade
          );
        });

      hasUnsavedChanges = minGradeChanged || assessmentsChanged;
    }
  }

  async function loadCalculator() {
    try {
      const data = await query(CALCULATOR, { id });
      calculator = data.calculator;
      assessments = calculator.assessments || [];
      newName = calculator.name;

      // Store initial state for change detection
      initialCalculatorState = {
        min_desired_grade: calculator.min_desired_grade,
        assessments: JSON.parse(JSON.stringify(calculator.assessments || [])),
      };

      hasUnsavedChanges = false; // Reset after load
    } catch (error) {
      console.error("Error loading calculator:", error);
      toast.error("Failed to load calculator");
    }
  }

  function addAssessment() {
    assessments = [...assessments, { name: "", weight: "", grade: null }];
    hasUnsavedChanges = true;
  }

  function removeAssessment(index) {
    assessments = assessments.filter((_, i) => i !== index);
    hasUnsavedChanges = true;
  }

  // Assessment reordering functions
  function moveAssessmentUp(index) {
    if (index <= 0) return;
    const newAssessments = [...assessments];
    [newAssessments[index - 1], newAssessments[index]] = [
      newAssessments[index],
      newAssessments[index - 1],
    ];
    assessments = newAssessments;
    autoSaveAssessmentOrder();
  }

  function moveAssessmentDown(index) {
    if (index >= assessments.length - 1) return;
    const newAssessments = [...assessments];
    [newAssessments[index], newAssessments[index + 1]] = [
      newAssessments[index + 1],
      newAssessments[index],
    ];
    assessments = newAssessments;
    autoSaveAssessmentOrder();
  }

  async function saveCalculator() {
    if (isSaving || !isMounted) return;

    isSaving = true;
    try {
      const data = await mutate(UPDATE_CALCULATOR, {
        id,
        minDesiredGrade: calculator.min_desired_grade
          ? parseFloat(calculator.min_desired_grade)
          : null,
        assessments: assessments.map((assessment) => ({
          name: assessment.name,
          weight: parseFloat(assessment.weight) || 0,
          grade: assessment.grade ? parseFloat(assessment.grade) : null,
        })),
      });

      // Instead of replacing the entire calculator object,
      // preserve the template_id and template properties
      const { template_id, template } = calculator;
      calculator = {
        ...data.updateCalculator,
        template_id,
        template,
      };
      assessments = calculator.assessments || [];

      // Update initial state after saving to reset change tracking
      initialCalculatorState = {
        min_desired_grade: calculator.min_desired_grade,
        assessments: JSON.parse(JSON.stringify(calculator.assessments || [])),
      };

      hasUnsavedChanges = false; // Reset unsaved changes flag
      if (!isAutoSaving) {
        toast.success("Changes saved successfully!");
      }
    } catch (error) {
      console.error("Error saving calculator:", error);
      toast.error("Failed to save changes");
    } finally {
      isSaving = false;
      isAutoSaving = false;
    }
  }

  async function autoSaveAssessmentOrder() {
    if (isSaving) return;

    isAutoSaving = true;
    const autosaveToast = toast.loading("Updating order...");

    try {
      await saveCalculator();
      toast.success("Order updated", { id: autosaveToast });
    } catch {
      toast.error("Failed to update order", { id: autosaveToast });
    }
  }

  function startEditName() {
    editingName = true;
    newName = calculator.name;
  }

  function cancelEditName() {
    editingName = false;
    newName = calculator.name;
  }

  async function saveNewName() {
    if (!newName.trim() || newName === calculator.name) {
      cancelEditName();
      return;
    }

    try {
      const data = await mutate(UPDATE_CALCULATOR, {
        id,
        name: newName.trim(),
      });

      // Preserve template information when updating calculator
      const { template_id, template } = calculator;
      calculator = {
        ...data.updateCalculator,
        template_id,
        template,
      };
      editingName = false;
      toast.success("Calculator renamed successfully!");
    } catch (error) {
      console.error("Error renaming calculator:", error);
      toast.error("Failed to rename calculator");
    }
  }

  function confirmDelete() {
    deleteDialogOpen = true;
  }

  async function deleteCalc() {
    try {
      const data = await mutate(DELETE_CALCULATOR, { id });
      if (data.deleteCalculator) {
        toast.success("Calculator deleted successfully");
        navigate("/", { replace: true });
      } else {
        toast.error("Failed to delete calculator");
      }
    } catch (error) {
      console.error("Error deleting calculator:", error);
      toast.error("Failed to delete calculator");
    } finally {
      deleteDialogOpen = false;
    }
  }

  function openPublishDialog() {
    publishDetails = {
      name: calculator.name,
      term: "",
      year: new Date().getFullYear(),
      institution: "",
    };
    publishDialogOpen = true;
  }

  async function publishAsTemplate() {
    if (
      !publishDetails.name.trim() ||
      !publishDetails.term.trim() ||
      !publishDetails.institution.trim() ||
      !publishDetails.year
    ) {
      toast.error("Please fill in all template details");
      return;
    }

    try {
      const data = await mutate(CREATE_TEMPLATE, {
        name: publishDetails.name,
        term: publishDetails.term,
        year: parseInt(publishDetails.year),
        institution: publishDetails.institution,
        assessments: assessments.map((assessment) => ({
          name: assessment.name,
          weight: parseFloat(assessment.weight) || 0,
        })),
      });

      if (data.createTemplate) {
        toast.success("Template published successfully!");
        publishDialogOpen = false;
      } else {
        toast.error("Failed to publish template");
      }
    } catch (error) {
      console.error("Error publishing template:", error);
      toast.error("Failed to publish template");
    }
  }

  function handleTemplateDelete() {
    calculator = {
      ...calculator,
      template: null,
      template_id: null,
    };
  }

  function getStatusColor(grade) {
    if (grade === "N/A") return "bg-muted text-muted-foreground";
    return "bg-background border text-foreground";
  }

  function handleAddAssessment() {
    assessments = [
      ...assessments,
      { id: `temp-${Date.now()}`, name: "", weight: 0, grade: null },
    ];

    // Focus the new assessment's name field
    setTimeout(() => {
      const newAssessmentNameField = document.querySelector(
        `.assessment-row:last-child input[type="text"]`
      );
      if (newAssessmentNameField) newAssessmentNameField.focus();
    }, 50);

    // Mark that we have unsaved changes
    hasUnsavedChanges = true;
  }

  // Confirm discard or save before navigating
  function confirmNavigation() {
    hasUnsavedChanges = false;
    unsavedChangesDialogOpen = false;
    if (pendingNavigation) {
      navigate(pendingNavigation);
      pendingNavigation = null;
    }
  }

  function saveAndNavigate() {
    saveCalculator().then(() => {
      unsavedChangesDialogOpen = false;
      if (pendingNavigation) {
        navigate(pendingNavigation);
        pendingNavigation = null;
      }
    });
  }

  function cancelNavigation() {
    unsavedChangesDialogOpen = false;
    pendingNavigation = null;
  }
</script>

<div class="bg-muted/40 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div class="flex items-center gap-2">
          <button class="mr-2" on:click={() => handleNavigate("/")}>
            <Button variant="ghost" size="icon" class="rounded-full">
              <ChevronLeft class="h-5 w-5" />
            </Button>
          </button>
          {#if editingName}
            <div class="flex items-center gap-2">
              <Input
                type="text"
                bind:value={newName}
                placeholder="Calculator name"
                class="text-xl font-bold h-10"
                autofocus
              />
              <Button variant="ghost" size="sm" on:click={saveNewName}
                >Save</Button
              >
              <Button variant="ghost" size="sm" on:click={cancelEditName}
                >Cancel</Button
              >
            </div>
          {:else}
            <h1
              class="text-3xl font-bold tracking-tight flex items-center gap-2"
            >
              <Calculator class="h-8 w-8 text-primary" />
              {calculator.name}
              <Button
                variant="ghost"
                size="icon"
                class="ml-2"
                on:click={startEditName}
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </h1>
          {/if}
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            variant="default"
            on:click={openPublishDialog}
            disabled={assessments.length === 0}
          >
            <FileUp class="h-4 w-4 mr-2" />
            Publish Template
          </Button>
          <Button variant="destructive" on:click={confirmDelete}>
            <Trash2 class="h-4 w-4 mr-2" />
            Delete Calculator
          </Button>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Assessment Area -->
      <div class="lg:col-span-2 space-y-6">
        <Card.Root>
          <Card.Header
            class="flex flex-row items-center justify-between space-y-0 p-6"
          >
            <Card.Title class="text-xl font-bold flex items-center">
              <BookOpen class="h-5 w-5 mr-2" />
              Assessments
            </Card.Title>
            <Button variant="outline" size="sm" on:click={addAssessment}>
              <Plus class="h-4 w-4 mr-2" />
              Add Assessment
            </Button>
          </Card.Header>

          <Separator />

          <Card.Content class="pt-6">
            {#if weightWarning}
              <div
                class="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4 text-amber-800 dark:text-amber-200"
              >
                <p class="text-sm">
                  Total weight: <strong>{totalWeight.toFixed(1)}%</strong>.
                  Assessment weights should total 100%.
                </p>
              </div>
            {/if}

            {#if assessments.length === 0}
              <div class="text-center py-8">
                <BookOpen
                  class="h-12 w-12 mx-auto text-muted-foreground mb-4"
                />
                <p class="text-muted-foreground mb-4">
                  No assessments added yet.
                </p>
                <Button on:click={addAssessment}>
                  <Plus class="h-4 w-4 mr-2" />
                  Add Your First Assessment
                </Button>
              </div>
            {:else}
              <div class="space-y-4">
                <!-- Table header -->
                <div
                  class="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-1 px-2 md:grid"
                >
                  <span class="col-span-1"></span>
                  <span class="col-span-4">Assessment</span>
                  <span class="col-span-2 text-center">Weight (%)</span>
                  <span class="col-span-3 text-center">Grade (%)</span>
                  <span class="col-span-2"></span>
                </div>

                <!-- Desktop Layout -->
                <div class="hidden md:block space-y-4">
                  {#each assessments as assessment, i}
                    <div
                      class="assessment-item bg-background rounded-lg p-3 shadow-sm border grid grid-cols-12 gap-4 items-center"
                    >
                      <div
                        class="col-span-1 flex justify-center items-center text-muted-foreground"
                      >
                        <div class="reorder-buttons">
                          <button
                            class="reorder-button"
                            on:click={() => moveAssessmentUp(i)}
                            disabled={i === 0}
                            aria-label="Move up"
                          >
                            <ChevronUp class="h-4 w-4" />
                          </button>
                          <button
                            class="reorder-button"
                            on:click={() => moveAssessmentDown(i)}
                            disabled={i === assessments.length - 1}
                            aria-label="Move down"
                          >
                            <ChevronDown class="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div class="col-span-4">
                        <Input
                          type="text"
                          bind:value={assessment.name}
                          placeholder="Assessment name"
                        />
                      </div>
                      <div class="col-span-2">
                        <Input
                          type="number"
                          bind:value={assessment.weight}
                          min="0"
                          max="100"
                          placeholder="Weight"
                          class="text-center"
                        />
                      </div>
                      <div class="col-span-3">
                        <Input
                          type="number"
                          bind:value={assessment.grade}
                          min="0"
                          max="100"
                          placeholder="Not graded"
                          class="text-center"
                        />
                      </div>
                      <div class="col-span-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          class="text-muted-foreground hover:text-destructive"
                          on:click={() => removeAssessment(i)}
                        >
                          <XCircle class="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- Mobile Layout -->
                <div class="block md:hidden space-y-4">
                  {#each assessments as assessment, i}
                    <div
                      class="assessment-item bg-background rounded-lg p-3 shadow-sm border relative"
                    >
                      <div class="grid grid-cols-1 gap-2">
                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-2">
                            <div class="flex gap-2">
                              <button
                                class="reorder-button"
                                on:click={() => moveAssessmentUp(i)}
                                disabled={i === 0}
                                aria-label="Move up"
                              >
                                <ChevronUp class="h-4 w-4" />
                              </button>
                              <button
                                class="reorder-button"
                                on:click={() => moveAssessmentDown(i)}
                                disabled={i === assessments.length - 1}
                                aria-label="Move down"
                              >
                                <ChevronDown class="h-4 w-4" />
                              </button>
                            </div>
                            <span class="text-sm font-medium">Assessment</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="text-muted-foreground hover:text-destructive h-8 w-8"
                            on:click={() => removeAssessment(i)}
                          >
                            <XCircle class="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          type="text"
                          bind:value={assessment.name}
                          placeholder="Assessment name"
                        />

                        <div class="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label
                              for={`weight-${i}`}
                              class="text-xs text-muted-foreground block mb-1"
                              >Weight (%)</label
                            >
                            <Input
                              id={`weight-${i}`}
                              type="number"
                              bind:value={assessment.weight}
                              min="0"
                              max="100"
                              placeholder="Weight"
                              class="text-center"
                            />
                          </div>
                          <div>
                            <label
                              for={`grade-${i}`}
                              class="text-xs text-muted-foreground block mb-1"
                              >Grade (%)</label
                            >
                            <Input
                              id={`grade-${i}`}
                              type="number"
                              bind:value={assessment.grade}
                              min="0"
                              max="100"
                              placeholder="—"
                              class="text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="flex justify-between mt-6">
                <Button variant="outline" on:click={addAssessment}>
                  <Plus class="h-4 w-4 mr-2" />
                  Add Assessment
                </Button>
                <Button
                  on:click={saveCalculator}
                  disabled={isSaving}
                  class="flex items-center"
                >
                  <Save class="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                  {#if !isMobile}
                    <Badge variant="secondary" class="ml-2">Ctrl+S</Badge>
                  {/if}
                </Button>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        {#if calculator.template_id && calculator.template}
          <Card.Root>
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <MessageSquare class="h-5 w-5" />
                Template Information
              </Card.Title>
              <Card.Description>
                This calculator is based on a shared template
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div class="flex justify-between items-start gap-4">
                <div>
                  <h3 class="text-lg font-semibold">
                    {calculator.template.name}
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    {calculator.template.institution || ""}
                    {#if calculator.template.term || calculator.template.year}
                      &bull; {calculator.template.term || ""}
                      {calculator.template.year || ""}
                    {/if}
                  </p>
                  <p class="text-sm text-muted-foreground mt-1">
                    By {calculator.template.creator?.username || "Unknown"}
                  </p>
                </div>

                <VoteButtons
                  voteCount={calculator.template.vote_count || 0}
                  userVote={calculator.template.user_vote || 0}
                  creatorId={calculator.template.creator?.id || ""}
                  templateId={calculator.template_id}
                  onDelete={handleTemplateDelete}
                />
              </div>

              <Separator class="my-4" />

              {#if calculator.template.assessments && calculator.template.assessments.length > 0}
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full justify-center"
                  on:click={() => openCommentsModal(calculator.template_id)}
                >
                  <MessageSquare class="h-4 w-4 mr-2" />
                  View Comments
                </Button>
              {/if}
            </Card.Content>
          </Card.Root>
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Target class="h-5 w-5" />
              Grade Target
            </Card.Title>
            <Card.Description>
              Set your minimum desired grade for this course
            </Card.Description>
          </Card.Header>
          <Card.Content>
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

              <Button
                variant="outline"
                on:click={saveCalculator}
                class="w-full flex items-center justify-center"
                disabled={isSaving}
              >
                <Save class="h-4 w-4 mr-2" />
                Save Target
                {#if !isMobile}
                  <Badge variant="outline" class="ml-2">Ctrl+S</Badge>
                {/if}
              </Button>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Gauge class="h-5 w-5" />
              Grade Summary
            </Card.Title>
            <Card.Description>
              Your current progress and what's needed
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-6">
              <!-- Current Grade -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <Label class="text-muted-foreground">Current Average</Label>
                  <div
                    class={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(finalGrade)}`}
                  >
                    {finalGrade}%
                  </div>
                </div>
                <div
                  class={`h-10 rounded-md flex items-center justify-center border ${isPassingGrade ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"}`}
                >
                  {#if finalGrade === "N/A"}
                    <p class="text-sm font-medium">No graded assessments yet</p>
                  {:else if isPassingGrade}
                    <p class="text-sm font-medium">Above target grade</p>
                  {:else}
                    <p class="text-sm font-medium">Below target grade</p>
                  {/if}
                </div>
              </div>

              <!-- Required Grade -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <Label class="text-muted-foreground"
                    >Needed on Remaining</Label
                  >
                  <div
                    class={`px-2 py-1 rounded-md text-sm font-medium ${getStatusColor(requiredGrade)}`}
                  >
                    {requiredGrade}%
                  </div>
                </div>
                <div
                  class={`h-10 rounded-md flex items-center justify-center border ${isTargetPossible ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"}`}
                >
                  {#if requiredGrade === "N/A"}
                    <p class="text-sm font-medium">All assessments graded</p>
                  {:else if !isTargetPossible}
                    <p class="text-sm font-medium">
                      Target requires >100% on remaining work
                    </p>
                  {:else}
                    <p class="text-sm font-medium">
                      Target is mathematically possible
                    </p>
                  {/if}
                </div>
              </div>

              <!-- Progress -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-muted-foreground"
                    >Assessment Completion</span
                  >
                  <span
                    >{completedAssessments}/{assessments.length} ({Math.round(
                      completionPercentage
                    )}%)</span
                  >
                </div>
                <Progress value={completionPercentage} class="h-2" />
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </div>
</div>

<!-- Delete Calculator Dialog -->
<AlertDialog.Root
  open={deleteDialogOpen}
  onOpenChange={(open) => (deleteDialogOpen = open)}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Calculator</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete "{calculator.name}"? This action cannot
        be undone and all your assessments will be lost.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        on:click={deleteCalc}
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Publish Template Dialog -->
<AlertDialog.Root
  open={publishDialogOpen}
  onOpenChange={(open) => (publishDialogOpen = open)}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Publish as Template</AlertDialog.Title>
      <AlertDialog.Description>
        Share your calculator structure with others as a template. This will
        only include assessment names and weights, not your grades.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="template-name">Template Name</Label>
        <Input
          type="text"
          id="template-name"
          bind:value={publishDetails.name}
          placeholder="Enter template name"
        />
      </div>
      <div class="space-y-2">
        <Label for="template-term">Term</Label>
        <Input
          type="text"
          id="template-term"
          bind:value={publishDetails.term}
          placeholder="e.g. Fall, Winter, Spring"
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="template-year">Year</Label>
          <Input
            type="number"
            id="template-year"
            bind:value={publishDetails.year}
            placeholder="Year"
          />
        </div>
        <div class="space-y-2">
          <Label for="template-institution">Institution</Label>
          <Input
            type="text"
            id="template-institution"
            bind:value={publishDetails.institution}
            placeholder="School or University"
          />
        </div>
      </div>
    </div>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action on:click={publishAsTemplate}>
        Publish Template
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Add Unsaved Changes Dialog -->
<AlertDialog.Root
  open={unsavedChangesDialogOpen}
  onOpenChange={(open) => (unsavedChangesDialogOpen = open)}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Unsaved Changes</AlertDialog.Title>
      <AlertDialog.Description>
        You have unsaved changes. What would you like to do?
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="flex justify-between">
      <Button variant="outline" on:click={cancelNavigation}>
        Continue Editing
      </Button>
      <div class="flex gap-2">
        <Button variant="destructive" on:click={confirmNavigation}>
          Discard Changes
        </Button>
        <Button variant="default" on:click={saveAndNavigate}>
          Save & Continue
        </Button>
      </div>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  /* Assessment item */
  .assessment-item {
    transition: all 0.2s;
  }

  .assessment-item:hover {
    border-color: hsl(var(--primary));
  }

  .reorder-buttons {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .reorder-button {
    height: 20px;
    width: 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted-foreground);
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .reorder-button:hover {
    background-color: hsl(var(--muted) / 0.3);
    color: hsl(var(--foreground));
  }

  .reorder-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
