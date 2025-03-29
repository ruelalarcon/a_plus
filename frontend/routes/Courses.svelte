<script>
  import { username, userId, logout } from "../lib/stores.js";
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
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Checkbox } from "$lib/components/ui/checkbox";

  let courses = [];
  let newCourseName = "";
  let newCourseCredits = 3.0; // Default to 3 credits
  let selectedPrereqs = [];
  let editingCourse = null;
  let editingPrereqs = [];

  onMount(async () => {
    if ($userId) {
      await loadCourses();
    }
  });

  async function loadCourses() {
    try {
      const data = await query(USER_COURSES, { userId: $userId });
      courses = data.user.courses;
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  }

  async function addCourse() {
    try {
      if (!newCourseName || newCourseName.trim() === "") {
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
        selectedPrereqs = [];
      } else {
        console.error("Invalid response format:", result);
      }
    } catch (error) {
      console.error("Error adding course:", error);
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
    } catch (error) {
      console.error("Error toggling course completion:", error);
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
      }
    } catch (error) {
      console.error("Error saving course edit:", error);
      alert("Failed to save course changes");
    }
  }

  async function deleteCourse(course) {
    if (!confirm(`Are you sure you want to delete "${course.name}"?`)) return;

    try {
      const data = await mutate(DELETE_COURSE, { id: course.id });

      if (data.deleteCourse) {
        courses = courses
          .filter((c) => c.id !== course.id)
          .map((c) => ({
            ...c,
            prerequisites: c.prerequisites.filter((p) => p.id !== course.id),
          }));

        selectedPrereqs = selectedPrereqs.filter((id) => id !== course.id);
        if (editingCourse) {
          editingPrereqs = editingPrereqs.filter((id) => id !== course.id);
        }
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    }
  }

  // Compute course levels based on prerequisites
  // This creates a directed acyclic graph (DAG) of courses
  // where each level contains courses that depend on previous levels
  $: sortedCourses = (() => {
    const levels = [];
    const visited = new Set();
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // Recursive function to determine course level based on prerequisites
    function getLevel(course) {
      if (visited.has(course.id)) return;
      visited.add(course.id);

      // Find the maximum level of all prerequisites
      let maxPrereqLevel = -1;
      for (const prereq of course.prerequisites) {
        if (!visited.has(prereq.id)) {
          getLevel(courseMap.get(prereq.id));
        }
        const prereqLevel = levels.findIndex((level) =>
          level.some((c) => c.id === prereq.id)
        );
        maxPrereqLevel = Math.max(maxPrereqLevel, prereqLevel);
      }

      // Place course in next level after its highest prerequisite
      const courseLevel = maxPrereqLevel + 1;
      if (!levels[courseLevel]) {
        levels[courseLevel] = [];
      }
      levels[courseLevel].push(course);
    }

    // Process all courses to build the level structure
    for (const course of courses) {
      if (!visited.has(course.id)) {
        getLevel(course);
      }
    }

    return levels;
  })();
</script>

<main class="container mx-auto px-4 py-8">
  <header
    class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight">My Courses</h1>
      <p class="text-muted-foreground">
        Welcome back, <strong>{$username}</strong>
      </p>
    </div>
    <Button variant="outline" on:click={logout}>Logout</Button>
  </header>

  <div class="space-y-8">
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold tracking-tight">Course Tracker</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Course</CardTitle>
          <CardDescription
            >Add a new course and specify any prerequisites</CardDescription
          >
        </CardHeader>
        <CardContent>
          <form class="space-y-4" onsubmit="return false;">
            <div class="space-y-2">
              <Label for="new-course">Course Name</Label>
              <Input
                type="text"
                id="new-course"
                bind:value={newCourseName}
                placeholder="Enter course name"
                on:keydown={(e) => e.key === "Enter" && addCourse()}
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
              />
            </div>

            {#if courses.length > 0}
              <div class="space-y-2">
                <Label>Prerequisites</Label>
                <div
                  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                >
                  {#each courses as course}
                    <div class="flex items-center space-x-2">
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
                      />
                      <Label for={`prereq-${course.id}`} class="cursor-pointer"
                        >{course.name}</Label
                      >
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </form>
        </CardContent>
        <CardFooter>
          <Button on:click={addCourse}>Add Course</Button>
        </CardFooter>
      </Card>

      {#if courses.length > 0}
        <div class="space-y-4">
          {#each sortedCourses as level}
            <div class="space-y-2">
              {#each level as course}
                <Card class={course.completed ? "bg-muted" : ""}>
                  {#if editingCourse?.id === course.id}
                    <CardContent class="p-4">
                      <form class="space-y-4">
                        <div class="space-y-2">
                          <Label for={`edit-course-${course.id}`}
                            >Course Name</Label
                          >
                          <Input
                            type="text"
                            id={`edit-course-${course.id}`}
                            bind:value={editingCourse.name}
                            placeholder="Course name"
                          />
                        </div>

                        <div class="space-y-2">
                          <Label for={`edit-course-credits-${course.id}`}
                            >Credits</Label
                          >
                          <Input
                            type="number"
                            id={`edit-course-credits-${course.id}`}
                            bind:value={editingCourse.credits}
                            min="0"
                            step="0.5"
                            placeholder="Enter credit amount"
                          />
                        </div>

                        <div class="space-y-2">
                          <Label>Prerequisites</Label>
                          <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                          >
                            {#each courses.filter((c) => c.id !== course.id) as prereq}
                              <div class="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-prereq-${course.id}-${prereq.id}`}
                                  checked={editingPrereqs.includes(prereq.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      editingPrereqs = [
                                        ...editingPrereqs,
                                        prereq.id,
                                      ];
                                    } else {
                                      editingPrereqs = editingPrereqs.filter(
                                        (id) => id !== prereq.id
                                      );
                                    }
                                  }}
                                />
                                <Label
                                  for={`edit-prereq-${course.id}-${prereq.id}`}
                                  class="cursor-pointer"
                                >
                                  {prereq.name}
                                </Label>
                              </div>
                            {/each}
                          </div>
                        </div>

                        <div class="flex justify-end gap-2">
                          <Button variant="outline" on:click={cancelEdit}
                            >Cancel</Button
                          >
                          <Button on:click={() => saveEdit(course)}>Save</Button
                          >
                        </div>
                      </form>
                    </CardContent>
                  {:else}
                    <CardContent class="p-4">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-2">
                          <Checkbox
                            id={`complete-${course.id}`}
                            checked={course.completed}
                            onCheckedChange={(checked) =>
                              toggleComplete(course)}
                          />
                          <Label
                            for={`complete-${course.id}`}
                            class="text-lg font-medium cursor-pointer"
                          >
                            {course.name}
                          </Label>
                        </div>
                        <div class="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            on:click={() => startEdit(course)}>Edit</Button
                          >
                          <Button
                            variant="destructive"
                            size="sm"
                            on:click={() => deleteCourse(course)}>Delete</Button
                          >
                        </div>
                      </div>

                      <div class="mt-2 text-sm text-muted-foreground">
                        <div>Credits: {course.credits}</div>
                        {#if course.prerequisites.length > 0}
                          <div>
                            Prerequisites: {course.prerequisites
                              .map((p) => p.name)
                              .join(", ")}
                          </div>
                        {/if}
                      </div>
                    </CardContent>
                  {/if}
                </Card>
              {/each}
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-10">
          <p class="text-muted-foreground">No courses added yet.</p>
        </div>
      {/if}
    </section>
  </div>
</main>
