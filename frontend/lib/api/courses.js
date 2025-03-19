export async function getCourses() {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
}

export async function createCourse(name, prerequisiteIds = []) {
    const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prerequisiteIds })
    });
    if (!response.ok) throw new Error('Failed to create course');
    return response.json();
}

export async function updateCourse(id, data) {
    const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update course');
    return response.json();
}

export async function deleteCourse(id) {
    const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete course');
    return response.json();
}