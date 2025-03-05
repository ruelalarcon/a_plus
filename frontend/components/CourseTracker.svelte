<div class="course-tracker">
    <h2>Course Tracker</h2>

    <div class="add-course">
        <input
            type="text"
            bind:value={newCourseName}
            placeholder="Enter course name"
            on:keydown={e => e.key === 'Enter' && addCourse()}
        />
        {#if courses.length > 0}
            <div class="prerequisites-select">
                <h4>Prerequisites:</h4>
                {#each courses as course}
                    <label>
                        <input
                            type="checkbox"
                            bind:group={selectedPrereqs}
                            value={course.id}
                        />
                        {course.name}
                    </label>
                {/each}
            </div>
        {/if}
        <button on:click={addCourse}>Add Course</button>
    </div>

    {#if courses.length > 0}
        <div class="course-list">
            {#each sortedCourses as level}
                <div class="course-level">
                    {#each level as course}
                        <div class="course-item" class:completed={course.completed}>
                            {#if editingCourse?.id === course.id}
                                <div class="edit-course">
                                    <input
                                        type="text"
                                        bind:value={editingCourse.name}
                                        placeholder="Course name"
                                    />
                                    <div class="prerequisites-select">
                                        <h4>Prerequisites:</h4>
                                        {#each courses.filter(c => c.id !== course.id) as prereq}
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    bind:group={editingPrereqs}
                                                    value={prereq.id}
                                                />
                                                {prereq.name}
                                            </label>
                                        {/each}
                                    </div>
                                    <div class="edit-actions">
                                        <button on:click={() => saveEdit(course)}>Save</button>
                                        <button on:click={cancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            {:else}
                                <div class="course-content">
                                    <input
                                        type="checkbox"
                                        checked={course.completed}
                                        on:change={() => toggleComplete(course)}
                                    />
                                    <span class="course-name">{course.name}</span>
                                    {#if course.prerequisites.length > 0}
                                        <div class="prerequisites">
                                            Prerequisites: {course.prerequisites.map(p => p.name).join(', ')}
                                        </div>
                                    {/if}
                                    <div class="course-actions">
                                        <button on:click={() => startEdit(course)}>Edit</button>
                                        <button on:click={() => deleteCourse(course)}>Delete</button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    {:else}
        <p>No courses added yet.</p>
    {/if}
</div>

<script>
    import { onMount } from 'svelte';

    let courses = [];
    let newCourseName = '';
    let selectedPrereqs = [];
    let editingCourse = null;
    let editingPrereqs = [];

    onMount(async () => {
        await loadCourses();
    });

    async function loadCourses() {
        const response = await fetch('/api/courses');
        if (response.ok) {
            const data = await response.json();
            courses = data.map(course => ({
                ...course,
                completed: Boolean(course.completed),
                prerequisites: course.prerequisites.map(p => ({
                    ...p,
                    completed: Boolean(p.completed)
                }))
            }));
        }
    }

    async function addCourse() {
        if (!newCourseName.trim()) return;

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newCourseName.trim(),
                prerequisiteIds: selectedPrereqs
            })
        });

        if (response.ok) {
            const newCourse = await response.json();
            courses = [...courses, newCourse];
            newCourseName = '';
            selectedPrereqs = [];
        }
    }

    async function toggleComplete(course) {
        const response = await fetch(`/api/courses/${course.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !course.completed })
        });

        if (response.ok) {
            const updatedCourse = await response.json();
            courses = courses.map(c =>
                c.id === updatedCourse.id ? updatedCourse : c
            );
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

        const response = await fetch(`/api/courses/${course.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: editingCourse.name.trim(),
                prerequisiteIds: editingPrereqs
            })
        });

        if (response.ok) {
            const updatedCourse = await response.json();
            courses = courses.map(c =>
                c.id === updatedCourse.id ? updatedCourse : c
            );
            cancelEdit();
        }
    }

    async function deleteCourse(course) {
        if (!confirm(`Are you sure you want to delete "${course.name}"?`)) return;

        const response = await fetch(`/api/courses/${course.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            courses = courses.filter(c => c.id !== course.id);
        }
    }

    // Compute course levels based on prerequisites
    $: sortedCourses = (() => {
        const levels = [];
        const visited = new Set();
        const courseMap = new Map(courses.map(c => [c.id, c]));

        function getLevel(course) {
            if (visited.has(course.id)) return;
            visited.add(course.id);

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

            const courseLevel = maxPrereqLevel + 1;
            if (!levels[courseLevel]) {
                levels[courseLevel] = [];
            }
            levels[courseLevel].push(course);
        }

        for (const course of courses) {
            if (!visited.has(course.id)) {
                getLevel(course);
            }
        }

        return levels;
    })();
</script>

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
        padding: 15px;
        border: 1px solid #ccc;
    }

    .course-item.completed {
        background: #e8f5e9;
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
        font-size: 0.9em;
        color: #666;
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

    input[type="text"] {
        padding: 8px;
        width: 100%;
        box-sizing: border-box;
    }

    button {
        padding: 5px 10px;
    }
</style>