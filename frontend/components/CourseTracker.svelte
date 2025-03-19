<script>
    import { onMount } from 'svelte';
    import * as courseApi from '../lib/api/courses.js';

    let courses = [];
    let newCourseName = '';
    let selectedPrereqs = [];
    let editingCourse = null;
    let editingPrereqs = [];

    onMount(async () => {
        await loadCourses();
    });

    async function loadCourses() {
        try {
            courses = await courseApi.getCourses();
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }

    async function addCourse() {
        if (!newCourseName.trim()) return;

        try {
            const newCourse = await courseApi.createCourse(newCourseName.trim(), selectedPrereqs);
            courses = [...courses, newCourse];
            newCourseName = '';
            selectedPrereqs = [];
        } catch (error) {
            console.error('Error adding course:', error);
            alert('Failed to add course');
        }
    }

    async function toggleComplete(course) {
        const newStatus = course.completed ? 0 : 1;
        try {
            const updatedCourse = await courseApi.updateCourse(course.id, { completed: newStatus });
            courses = courses.map(c =>
                c.id === updatedCourse.id ? updatedCourse : c
            );
        } catch (error) {
            console.error('Error toggling course completion:', error);
            alert('Failed to update course status');
        }
    }

    function startEdit(course) {
        editingCourse = { ...course };
        editingPrereqs = course.prerequisites.map(p => p.id);
    }

    function cancelEdit() {
        editingCourse = null;
        editingPrereqs = [];
    }

    async function saveEdit(course) {
        if (!editingCourse.name.trim()) return;

        try {
            const updatedCourse = await courseApi.updateCourse(course.id, {
                name: editingCourse.name.trim(),
                prerequisiteIds: editingPrereqs
            });
            courses = courses.map(c =>
                c.id === updatedCourse.id ? updatedCourse : c
            );
            cancelEdit();
        } catch (error) {
            console.error('Error saving course edit:', error);
            alert('Failed to save course changes');
        }
    }

    async function deleteCourse(course) {
        if (!confirm(`Are you sure you want to delete "${course.name}"?`)) return;

        try {
            await courseApi.deleteCourse(course.id);
            courses = courses
                .filter(c => c.id !== course.id)
                .map(c => ({
                    ...c,
                    prerequisites: c.prerequisites.filter(p => p.id !== course.id)
                }));

            selectedPrereqs = selectedPrereqs.filter(id => id !== course.id);
            if (editingCourse) {
                editingPrereqs = editingPrereqs.filter(id => id !== course.id);
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('Failed to delete course');
        }
    }

    // Compute course levels based on prerequisites
    // This creates a directed acyclic graph (DAG) of courses
    // where each level contains courses that depend on previous levels
    $: sortedCourses = (() => {
        const levels = [];
        const visited = new Set();
        const courseMap = new Map(courses.map(c => [c.id, c]));

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
                const prereqLevel = levels.findIndex(level =>
                    level.some(c => c.id === prereq.id)
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

<section class="course-tracker">
    <header>
        <h2>Course Tracker</h2>
    </header>

    <form class="add-course" onsubmit="return false;">
        <div class="form-group">
            <label for="new-course">Course Name</label>
            <input
                type="text"
                id="new-course"
                bind:value={newCourseName}
                placeholder="Enter course name"
                on:keydown={e => e.key === 'Enter' && addCourse()}
            />
        </div>

        {#if courses.length > 0}
            <fieldset class="prerequisites-select">
                <legend>Prerequisites</legend>
                {#each courses as course}
                    <div class="checkbox-group">
                        <input
                            type="checkbox"
                            id={`prereq-${course.id}`}
                            bind:group={selectedPrereqs}
                            value={course.id}
                        />
                        <label for={`prereq-${course.id}`}>{course.name}</label>
                    </div>
                {/each}
            </fieldset>
        {/if}
        <button type="button" on:click={addCourse}>
            Add Course
        </button>
    </form>

    {#if courses.length > 0}
        <div class="course-list">
            {#each sortedCourses as level}
                <section class="course-level">
                    {#each level as course}
                        <article class="course-item" class:completed={course.completed}>
                            {#if editingCourse?.id === course.id}
                                <form class="edit-course">
                                    <div class="form-group">
                                        <label for={`edit-course-${course.id}`}>Course Name</label>
                                        <input
                                            type="text"
                                            id={`edit-course-${course.id}`}
                                            bind:value={editingCourse.name}
                                            placeholder="Course name"
                                        />
                                    </div>
                                    <fieldset class="prerequisites-select">
                                        <legend>Prerequisites</legend>
                                        {#each courses.filter(c => c.id !== course.id) as prereq}
                                            <div class="checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    id={`edit-prereq-${course.id}-${prereq.id}`}
                                                    bind:group={editingPrereqs}
                                                    value={prereq.id}
                                                />
                                                <label for={`edit-prereq-${course.id}-${prereq.id}`}>
                                                    {prereq.name}
                                                </label>
                                            </div>
                                        {/each}
                                    </fieldset>
                                    <nav class="edit-actions">
                                        <button type="button" on:click={() => saveEdit(course)}>Save</button>
                                        <button type="button" on:click={cancelEdit}>Cancel</button>
                                    </nav>
                                </form>
                            {:else}
                                <div class="course-content">
                                    <div class="course-header">
                                        <input
                                            type="checkbox"
                                            id={`complete-${course.id}`}
                                            checked={course.completed}
                                            on:change={() => toggleComplete(course)}
                                        />
                                        <label for={`complete-${course.id}`} class="course-name">
                                            {course.name}
                                        </label>
                                    </div>
                                    {#if course.prerequisites.length > 0}
                                        <div class="prerequisites">
                                            Prerequisites: {course.prerequisites.map(p => p.name).join(', ')}
                                        </div>
                                    {/if}
                                    <nav class="course-actions">
                                        <button on:click={() => startEdit(course)}>Edit</button>
                                        <button on:click={() => deleteCourse(course)}>Delete</button>
                                    </nav>
                                </div>
                            {/if}
                        </article>
                    {/each}
                </section>
            {/each}
        </div>
    {:else}
        <p>No courses added yet.</p>
    {/if}
</section>

<style>
    .add-course {
        margin: 20px 0;
    }

    .prerequisites-select {
        margin: 10px 0;
    }

    .prerequisites-select label {
        display: block;
        margin: 5px 0;
    }

    .course-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .course-level {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .course-item {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
    }

    .course-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .course-name {
        flex-grow: 1;
    }

    .prerequisites {
        margin: 5px 0;
    }

    .course-actions {
        display: flex;
        gap: 5px;
    }

    .edit-course {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .edit-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 5px 0;
    }

    .prerequisites-select {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
    }

    .prerequisites-select legend {
        padding: 0 5px;
    }

    .form-group {
        margin: 10px 0;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
    }

    .course-header {
        display: flex;
        align-items: center;
        gap: 10px;
    }
</style>