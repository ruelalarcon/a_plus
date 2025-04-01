<script>
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import * as Tooltip from "$lib/components/ui/tooltip";

  // Icons
  import Book from "lucide-svelte/icons/book";
  import Pencil from "lucide-svelte/icons/pencil";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import Check from "lucide-svelte/icons/check";
  import X from "lucide-svelte/icons/x";
  import GraduationCap from "lucide-svelte/icons/graduation-cap";

  // Props
  export let course;
  export let onDelete = () => {};
  export let onEdit = () => {};
  export let onToggleComplete = () => {};

  // Determine if course has prerequisites
  $: hasPrerequisites = course.prerequisites && course.prerequisites.length > 0;
  $: prerequisiteNames = hasPrerequisites
    ? course.prerequisites.map((p) => p.name).join(", ")
    : "";

  // Determine status and formatting
  $: isCompleted = course.completed || false;
  $: statusColor = isCompleted ? "text-green-500" : "text-amber-500";
  $: statusIcon = isCompleted ? Check : X;
</script>

<Card.Card
  class="w-full h-full flex flex-col transition-all duration-200 hover:shadow-md"
  data-test="course-card"
  data-course-id={course.id}
>
  <Card.CardHeader>
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <Card.CardTitle class="text-xl font-bold flex items-center gap-2">
          <Book class="h-5 w-5 text-primary" />
          <span data-test="course-name">{course.name}</span>
        </Card.CardTitle>
        <Card.CardDescription data-test="course-credits">
          {course.credits} Credit{course.credits !== 1 ? "s" : ""}
        </Card.CardDescription>
      </div>
      <div class="flex items-center gap-1">
        <Tooltip.Root>
          <Tooltip.Trigger>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              on:click={() => onEdit(course)}
              data-test="edit-course-btn"
            >
              <Pencil class="h-4 w-4" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Edit course</Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-destructive hover:text-destructive"
              on:click={() => onDelete(course)}
              data-test="delete-course-btn"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Delete course</Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  </Card.CardHeader>

  <Card.CardContent>
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Checkbox
            id={`complete-${course.id}`}
            checked={isCompleted}
            onCheckedChange={() => onToggleComplete(course)}
            data-test="complete-checkbox"
          />
          <label
            for={`complete-${course.id}`}
            class="text-sm font-medium cursor-pointer"
          >
            Mark as completed
          </label>
        </div>
        <div class="flex items-center gap-1" data-test="course-status">
          <svelte:component
            this={statusIcon}
            class={`h-4 w-4 ${statusColor}`}
          />
          <span class={`text-sm font-medium ${statusColor}`}>
            {isCompleted ? "Completed" : "Incomplete"}
          </span>
        </div>
      </div>

      {#if hasPrerequisites}
        <div data-test="prerequisites-section">
          <h4
            class="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"
          >
            <GraduationCap class="h-3.5 w-3.5" />
            Prerequisites
          </h4>
          <p class="text-sm" data-test="prerequisites-list">
            {prerequisiteNames}
          </p>
        </div>
      {/if}
    </div>
  </Card.CardContent>

  <Card.CardFooter class="mt-auto pt-2">
    {#if hasPrerequisites}
      <Badge variant="outline" class="mr-2" data-test="prerequisites-badge">
        {course.prerequisites.length} Prerequisite{course.prerequisites
          .length !== 1
          ? "s"
          : ""}
      </Badge>
    {/if}
    <Badge
      variant={isCompleted ? "default" : "secondary"}
      data-test="status-badge"
    >
      {isCompleted ? "Completed" : "In Progress"}
    </Badge>
  </Card.CardFooter>
</Card.Card>
