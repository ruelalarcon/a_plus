/**
 * @module courses
 * API module for managing courses and their prerequisites
 */

/**
 * Fetch all courses for the current user
 * @returns {Promise<Array<{
 *   id: number,
 *   name: string,
 *   completed: boolean,
 *   prerequisites: Array<number>
 * }>>} List of user's courses with their prerequisites
 * @throws {Error} If the API request fails
 */
export async function getCourses() {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
}

/**
 * Create a new course with optional prerequisites
 * @param {string} name - Course name
 * @param {Array<number>} [prerequisiteIds=[]] - IDs of prerequisite courses
 * @returns {Promise<{
 *   id: number,
 *   name: string,
 *   completed: boolean,
 *   prerequisites: Array<number>
 * }>} Newly created course details
 * @throws {Error} If the API request fails
 */
export async function createCourse(name, prerequisiteIds = []) {
    const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prerequisiteIds })
    });
    if (!response.ok) throw new Error('Failed to create course');
    return response.json();
}

/**
 * Update an existing course
 * @param {number} id - Course ID to update
 * @param {Object} data - Course data to update
 * @param {string} [data.name] - New course name
 * @param {boolean} [data.completed] - New completion status
 * @param {Array<number>} [data.prerequisiteIds] - New list of prerequisite course IDs
 * @returns {Promise<{
 *   id: number,
 *   name: string,
 *   completed: boolean,
 *   prerequisites: Array<number>
 * }>} Updated course details
 * @throws {Error} If the API request fails
 */
export async function updateCourse(id, data) {
    const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update course');
    return response.json();
}

/**
 * Delete a course
 * @param {number} id - Course ID to delete
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If the API request fails
 */
export async function deleteCourse(id) {
    const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete course');
    return response.json();
}