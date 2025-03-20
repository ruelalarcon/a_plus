/**
 * @module calculators
 * API module for managing grade calculators
 */

/**
 * Fetch all calculators for the current user
 * @returns {Promise<Array<{
 *   id: number,
 *   name: string,
 *   min_desired_grade: number|null,
 *   assessments: Array<{
 *     id: number,
 *     name: string,
 *     weight: number,
 *     grade: number|null
 *   }>
 * }>>} List of user's calculators with their assessments
 * @throws {Error} If the API request fails
 */
export async function getCalculators() {
    const response = await fetch('/api/calculators');
    if (!response.ok) throw new Error('Failed to fetch calculators');
    return response.json();
}

/**
 * Fetch a specific calculator by ID
 * @param {number} id - Calculator ID
 * @returns {Promise<{
 *   id: number,
 *   name: string,
 *   min_desired_grade: number|null,
 *   template_id: number|null,
 *   assessments: Array<{
 *     id: number,
 *     name: string,
 *     weight: number,
 *     grade: number|null
 *   }>
 * }>} Calculator details with assessments
 * @throws {Error} If the API request fails
 */
export async function getCalculator(id) {
    const response = await fetch(`/api/calculators/${id}`);
    if (!response.ok) throw new Error('Failed to fetch calculator');
    return response.json();
}

/**
 * Create a new calculator
 * @param {string} name - Calculator name
 * @param {number|null} [min_desired_grade] - Optional minimum desired grade
 * @returns {Promise<{
 *   id: number,
 *   name: string,
 *   min_desired_grade: number|null
 * }>} Newly created calculator details
 * @throws {Error} If the API request fails
 */
export async function createCalculator(name, min_desired_grade = null) {
    const response = await fetch('/api/calculators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, min_desired_grade })
    });
    if (!response.ok) throw new Error('Failed to create calculator');
    return response.json();
}

/**
 * Update an existing calculator
 * @param {number} id - Calculator ID
 * @param {Object} data - Calculator data to update
 * @param {string} [data.name] - New calculator name
 * @param {number|null} [data.min_desired_grade] - New minimum desired grade
 * @param {Array<{
 *   name: string,
 *   weight: number,
 *   grade: number|null
 * }>} [data.assessments] - New list of assessments
 * @returns {Promise<Object>} Updated calculator details
 * @throws {Error} If the API request fails
 */
export async function updateCalculator(id, data) {
    const response = await fetch(`/api/calculators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update calculator');
    return response.json();
}

/**
 * Delete a calculator
 * @param {number} id - Calculator ID to delete
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If the API request fails
 */
export async function deleteCalculator(id) {
    const response = await fetch(`/api/calculators/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete calculator');
    return response.json();
}

/**
 * Publish a calculator as a template
 * @param {number} id - Calculator ID to publish
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Template name
 * @param {string} templateData.term - Academic term
 * @param {string} templateData.year - Academic year
 * @param {string} templateData.institution - Institution name
 * @param {Array<{name: string, weight: number}>} templateData.assessments - Assessment structure
 * @returns {Promise<{id: number}>} Newly created template ID
 * @throws {Error} If the API request fails
 */
export async function publishTemplate(id, templateData) {
    const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
    });
    if (!response.ok) throw new Error('Failed to publish template');
    return response.json();
}