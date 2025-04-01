<script>
  import { username, userId } from "../lib/stores.js";
  import { onMount } from "svelte";
  import { query, mutate } from "../lib/graphql/client.js";
  import { USER_COURSES } from "../lib/graphql/queries.js";
  import {
    CREATE_COURSE,
    UPDATE_COURSE,
    DELETE_COURSE,
  } from "../lib/graphql/mutations.js";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import CourseCard from "../components/CourseCard.svelte";
  import { toast } from "svelte-sonner";
  import {
    sortCoursesByPrerequisites,
    flattenSortedCourses,
    filterCourses,
    isPrerequisiteForOtherCourses,
  } from "../lib/utils/courseSorting.js";

  // Icons
  import BookOpen from "lucide-svelte/icons/book-open";
  import GraduationCap from "lucide-svelte/icons/graduation-cap";
  import Search from "lucide-svelte/icons/search";
  import Plus from "lucide-svelte/icons/plus";

  let courses = [];
  let newCourseName = "";
  let newCourseCredits = 3.0; // Default to 3 credits
  let selectedPrereqs = [];
  let editingCourse = null;
  let editingPrereqs = [];
  let deleteDialogOpen = false;
  let courseToDelete = null;
  let searchQuery = "";
  let activeTab = "all";

  onMount(async () => {
    if ($userId) {
      await loadCourses();
    }

    // Setup keyboard shortcuts specific to courses page
    function handleKeydown(e) {
      // Alt+N to focus new course name input
      if (
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();

        // Focus the course name input field
        const courseNameInput = document.getElementById("new-course");
        if (courseNameInput) {
          courseNameInput.focus();

          // Scroll to the input field to ensure it's visible
          courseNameInput.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }

    // Add event listener
    document.addEventListener("keydown", handleKeydown);

    // Remove event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  async function loadCourses() {
    try {
      const data = await query(USER_COURSES, { userId: $userId });
      courses = data.user.courses;
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
    }
  }

  async function addCourse(e) {
    // Prevent default form submission behavior if called from a form
    if (e) e.preventDefault();

    try {
      if (!newCourseName || newCourseName.trim() === "") {
        toast.error("Please enter a course name");
        return;
      }

      const result = await mutate(CREATE_COURSE, {
        name: newCourseName,
        credits: parseFloat(newCourseCredits),
        prerequisiteIds: selectedPrereqs.length > 0 ? selectedPrereqs : null,
      });

      if (result && result.createCourse) {
        courses = [...courses, result.createCourse];
        newCourseName = "";
        newCourseCredits = 3.0;
        selectedPrereqs = [];
        toast.success("Course added successfully");
      } else {
        console.error("Invalid response format:", result);
        toast.error("Failed to add course");
      }
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course");
    }
  }

  async function toggleComplete(course) {
    try {
      const data = await mutate(UPDATE_COURSE, {
        id: course.id,
        completed: !course.completed,
      });

      courses = courses.map((c) =>
        c.id === data.updateCourse.id ? data.updateCourse : c
      );
      toast.success(
        `Course marked as ${data.updateCourse.completed ? "completed" : "incomplete"}`
      );
    } catch (error) {
      console.error("Error toggling course completion:", error);
      toast.error("Failed to update course");
    }
  }

  function startEdit(course) {
    editingCourse = { ...course };
    editingPrereqs = course.prerequisites.map((p) => p.id);
  }

  function cancelEdit() {
    editingCourse = null;
    editingPrereqs = [];
  }

  async function saveEdit(course) {
    if (!editingCourse.name.trim()) return;

    try {
      const data = await mutate(UPDATE_COURSE, {
        id: course.id,
        name: editingCourse.name.trim(),
        credits: parseFloat(editingCourse.credits),
        prerequisiteIds: editingPrereqs,
      });

      if (data.updateCourse) {
        courses = courses.map((c) =>
          c.id === data.updateCourse.id ? data.updateCourse : c
        );
        cancelEdit();
        toast.success("Course updated successfully");
      }
    } catch (error) {
      console.error("Error saving course edit:", error);
      toast.error("Failed to update course");
    }
  }

  function confirmDelete(course) {
    courseToDelete = course;
    deleteDialogOpen = true;
  }

  async function deleteCourse() {
    if (!courseToDelete) return;

    try {
      const data = await mutate(DELETE_COURSE, { id: courseToDelete.id });

      if (data.deleteCourse) {
        courses = courses
          .filter((c) => c.id !== courseToDelete.id)
          .map((c) => ({
            ...c,
            prerequisites: c.prerequisites.filter(
              (p) => p.id !== courseToDelete.id
            ),
          }));

        selectedPrereqs = selectedPrereqs.filter(
          (id) => id !== courseToDelete.id
        );
        if (editingCourse) {
          editingPrereqs = editingPrereqs.filter(
            (id) => id !== courseToDelete.id
          );
        }
        toast.success("Course deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    } finally {
      deleteDialogOpen = false;
      courseToDelete = null;
    }
  }

  // Compute sorted courses using the utility function
  $: sortedCourses = sortCoursesByPrerequisites(courses);

  // Flatten sorted courses into a single array for easier filtering
  $: flattenedSortedCourses = flattenSortedCourses(sortedCourses);

  // Apply filters to the properly sorted courses array
  $: filteredCourses = filterCourses(
    flattenedSortedCourses,
    activeTab,
    searchQuery
  );

  $: completedCount = courses.filter((c) => c.completed).length;
  $: totalCredits = courses.reduce(
    (sum, course) => sum + parseFloat(course.credits),
    0
  );
  $: completedCredits = courses
    .filter((c) => c.completed)
    .reduce((sum, course) => sum + parseFloat(course.credits), 0);
</script>

<div class="bg-muted/40 min-h-screen" data-test="courses-page">
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
            <BookOpen class="h-8 w-8 text-primary" />
            Course Planner
          </h1>
          <p class="text-muted-foreground" data-test="user-greeting">
            Welcome back, <strong>{$username}</strong>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-4">
            <div class="text-center" data-test="total-courses-stat">
              <p class="text-sm text-muted-foreground">Total Courses</p>
              <p class="text-2xl font-bold">{courses.length}</p>
            </div>
            <div class="text-center" data-test="completed-courses-stat">
              <p class="text-sm text-muted-foreground">Completed</p>
              <p class="text-2xl font-bold">{completedCount}</p>
            </div>
            <div class="text-center" data-test="total-credits-stat">
              <p class="text-sm text-muted-foreground">Total Credits</p>
              <p class="text-2xl font-bold">{totalCredits}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Sidebar with Add Course Form -->
      <div class="md:col-span-1">
        <Card.Root data-test="add-course-card">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Plus class="h-5 w-5" />
              Add New Course
            </Card.Title>
            <Card.Description>Add courses to your planner</Card.Description>
          </Card.Header>
          <Card.Content>
            <form
              class="space-y-4"
              on:submit|preventDefault={addCourse}
              data-test="add-course-form"
            >
              <div class="space-y-2">
                <Label for="new-course">Course Name</Label>
                <Input
                  type="text"
                  id="new-course"
                  bind:value={newCourseName}
                  placeholder="Enter course name"
                  data-test="course-name-input"
                />
              </div>

              <div class="space-y-2">
                <Label for="new-course-credits">Credits</Label>
                <Input
                  type="number"
                  id="new-course-credits"
                  bind:value={newCourseCredits}
                  min="0"
                  step="0.5"
                  placeholder="Enter credit amount"
                  data-test="course-credits-input"
                />
              </div>

              {#if courses.length > 0}
                <div class="space-y-2">
                  <Label>Prerequisites</Label>
                  <div
                    class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-2"
                    data-test="prerequisites-list"
                  >
                    {#each courses as course}
                      <div
                        class="flex items-center space-x-2"
                        data-test="prerequisite-item"
                      >
                        <Checkbox
                          id={`prereq-${course.id}`}
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
                          data-test="prerequisite-checkbox"
                          data-course-id={course.id}
                        />
                        <Label
                          for={`prereq-${course.id}`}
                          class="cursor-pointer"
                        >
                          {course.name}
                        </Label>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              <button type="submit" class="hidden">Submit</button>
            </form>
          </Card.Content>
          <Card.Footer>
            <Button
              on:click={addCourse}
              class="w-full"
              data-test="add-course-btn"
            >
              <Plus class="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </Card.Footer>
        </Card.Root>

        <div class="mt-6">
          <Card.Root data-test="progress-summary-card">
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <GraduationCap class="h-5 w-5" />
                Progress Summary
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="space-y-4">
                <div>
                  <div
                    class="flex justify-between text-sm mb-1"
                    data-test="courses-completion"
                  >
                    <span>Courses Completed</span>
                    <span>{completedCount} / {courses.length}</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary rounded-full"
                      style="width: {courses.length
                        ? (completedCount / courses.length) * 100
                        : 0}%"
                      data-test="courses-progress-bar"
                    ></div>
                  </div>
                </div>
                <div>
                  <div
                    class="flex justify-between text-sm mb-1"
                    data-test="credits-completion"
                  >
                    <span>Credits Completed</span>
                    <span>{completedCredits} / {totalCredits}</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary rounded-full"
                      style="width: {totalCredits
                        ? (completedCredits / totalCredits) * 100
                        : 0}%"
                      data-test="credits-progress-bar"
                    ></div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </div>

      <!-- Main Course List -->
      <div class="md:col-span-2">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <Tabs.Root
            bind:value={activeTab}
            class="w-full"
            data-test="course-tabs"
          >
            <Tabs.List class="w-full sm:w-auto">
              <Tabs.Trigger value="all" data-test="all-courses-tab"
                >All Courses</Tabs.Trigger
              >
              <Tabs.Trigger value="completed" data-test="completed-courses-tab"
                >Completed</Tabs.Trigger
              >
              <Tabs.Trigger
                value="incomplete"
                data-test="incomplete-courses-tab">In Progress</Tabs.Trigger
              >
            </Tabs.List>
          </Tabs.Root>

          <div class="relative w-full sm:w-80">
            <Search
              class="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4"
            />
            <Input
              type="search"
              placeholder="Search courses..."
              class="pl-8 w-full"
              bind:value={searchQuery}
              data-test="course-search"
            />
          </div>
        </div>

        {#if filteredCourses.length > 0}
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-test="courses-grid"
          >
            {#each filteredCourses as course}
              <CourseCard
                {course}
                onDelete={confirmDelete}
                onEdit={startEdit}
                onToggleComplete={toggleComplete}
              />
            {/each}
          </div>
        {:else}
          <div
            class="text-center py-12 bg-background rounded-lg border"
            data-test="empty-state"
          >
            <GraduationCap
              class="h-12 w-12 mx-auto text-muted-foreground mb-4"
            />
            {#if searchQuery}
              <p class="text-muted-foreground" data-test="empty-search-message">
                No courses match your search.
              </p>
            {:else if activeTab !== "all"}
              <p class="text-muted-foreground" data-test="empty-tab-message">
                No {activeTab} courses found.
              </p>
            {:else}
              <p class="text-muted-foreground" data-test="empty-all-message">
                No courses added yet. Add your first course to get started!
              </p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Edit Course Dialog -->
{#if editingCourse}
  <AlertDialog.Root
    open={!!editingCourse}
    onOpenChange={(open) => !open && cancelEdit()}
    data-test="edit-course-dialog"
  >
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Edit Course</AlertDialog.Title>
        <AlertDialog.Description>
          Make changes to your course information.
        </AlertDialog.Description>
      </AlertDialog.Header>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="edit-course-name">Course Name</Label>
          <Input
            type="text"
            id="edit-course-name"
            bind:value={editingCourse.name}
            placeholder="Enter course name"
            data-test="edit-course-name-input"
          />
        </div>

        <div class="space-y-2">
          <Label for="edit-course-credits">Credits</Label>
          <Input
            type="number"
            id="edit-course-credits"
            bind:value={editingCourse.credits}
            min="0"
            step="0.5"
            placeholder="Enter credit amount"
            data-test="edit-course-credits-input"
          />
        </div>

        {#if courses.length > 1}
          <div class="space-y-2">
            <Label>Prerequisites</Label>
            <div
              class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-2"
              data-test="edit-prerequisites-list"
            >
              {#each courses.filter((c) => c.id !== editingCourse.id) as course}
                <div
                  class="flex items-center space-x-2"
                  data-test="edit-prerequisite-item"
                >
                  <Checkbox
                    id={`edit-prereq-${course.id}`}
                    checked={editingPrereqs.includes(course.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        editingPrereqs = [...editingPrereqs, course.id];
                      } else {
                        editingPrereqs = editingPrereqs.filter(
                          (id) => id !== course.id
                        );
                      }
                    }}
                    data-test="edit-prerequisite-checkbox"
                    data-course-id={course.id}
                  />
                  <Label
                    for={`edit-prereq-${course.id}`}
                    class="cursor-pointer"
                  >
                    {course.name}
                  </Label>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <AlertDialog.Footer>
        <AlertDialog.Cancel data-test="cancel-edit-btn"
          >Cancel</AlertDialog.Cancel
        >
        <AlertDialog.Action
          on:click={() => saveEdit(editingCourse)}
          data-test="save-edit-btn"
        >
          Save Changes
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}

<!-- Delete Course Dialog -->
<AlertDialog.Root
  open={deleteDialogOpen}
  onOpenChange={(open) => (deleteDialogOpen = open)}
  data-test="delete-course-dialog"
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Course</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this course? This action cannot be
        undone.
        {#if courseToDelete && isPrerequisiteForOtherCourses(courses, courseToDelete.id)}
          <div class="mt-2 text-red-500" data-test="prerequisite-warning">
            Warning: This course is a prerequisite for other courses. Deleting
            it will remove it from their prerequisites.
          </div>
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel data-test="cancel-delete-btn"
        >Cancel</AlertDialog.Cancel
      >
      <AlertDialog.Action
        on:click={deleteCourse}
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        data-test="confirm-delete-btn"
      >
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
