/**
 * @module templates
 * API module for managing calculator templates
 */

/**
 * Search for calculator templates with optional filters
 * @param {string} [query] - Search query for template name
 * @param {string} [term] - Academic term filter
 * @param {string} [year] - Academic year filter
 * @param {string} [institution] - Institution name filter
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=20] - Number of results per page
 * @returns {Promise<{templates: Array<Object>, total: number, page: number, limit: number}>}
 * @throws {Error} If the API request fails
 */
export async function searchTemplates(query, term, year, institution, page = 1, limit = 20) {
    const params = new URLSearchParams({
        query: query || '',
        term: term || '',
        year: year || '',
        institution: institution || '',
        page,
        limit
    });

    const response = await fetch(`/api/templates/search?${params}`);
    if (!response.ok) throw new Error('Failed to search templates');
    return response.json();
}

/**
 * Fetch a specific template by ID
 * @param {number} id - Template ID
 * @returns {Promise<Object>} Template details
 * @throws {Error} If the API request fails
 */
export async function getTemplate(id) {
    const response = await fetch(`/api/templates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
}

/**
 * Create a new calculator from an existing template
 * @param {number} id - Template ID to use as base
 * @returns {Promise<{id: number}>} New calculator ID
 * @throws {Error} If the API request fails
 */
export async function useTemplate(id) {
    const response = await fetch(`/api/templates/${id}/use`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to use template');
    return response.json();
}

/**
 * Vote on a template
 * @param {number} id - Template ID
 * @param {number} vote - Vote value: 1 for upvote, -1 for downvote, 0 to remove vote
 * @returns {Promise<{vote_count: number}>} Updated vote count
 * @throws {Error} If the API request fails
 */
export async function voteOnTemplate(id, vote) {
    const method = vote === 0 ? 'DELETE' : 'POST';
    const response = await fetch(`/api/templates/${id}/vote`, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify({ vote }) : undefined
    });
    if (!response.ok) throw new Error('Failed to vote on template');
    return response.json();
}

/**
 * Get comments for a template
 * @param {number} id - Template ID
 * @returns {Promise<Array<{id: number, content: string, username: string, created_at: string, updated_at: string}>>}
 * @throws {Error} If the API request fails
 */
export async function getTemplateComments(id) {
    const response = await fetch(`/api/templates/${id}/comments`);
    if (!response.ok) throw new Error('Failed to fetch template comments');
    return response.json();
}

/**
 * Add a comment to a template
 * @param {number} id - Template ID
 * @param {string} content - Comment content
 * @returns {Promise<{id: number, content: string, username: string, created_at: string, updated_at: string}>}
 * @throws {Error} If the API request fails
 */
export async function addTemplateComment(id, content) {
    const response = await fetch(`/api/templates/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
}

/**
 * Update an existing template comment
 * @param {number} templateId - Template ID
 * @param {number} commentId - Comment ID
 * @param {string} content - Updated comment content
 * @returns {Promise<{id: number, content: string, username: string, created_at: string, updated_at: string}>}
 * @throws {Error} If the API request fails
 */
export async function updateTemplateComment(templateId, commentId, content) {
    const response = await fetch(`/api/templates/${templateId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
}

/**
 * Delete a template comment
 * @param {number} templateId - Template ID
 * @param {number} commentId - Comment ID to delete
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If the API request fails
 */
export async function deleteTemplateComment(templateId, commentId) {
    const response = await fetch(`/api/templates/${templateId}/comments/${commentId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return response.json();
}

/**
 * Get templates created by the current user
 * @returns {Promise<Array<Object>>} List of user's templates
 * @throws {Error} If the API request fails
 */
export async function getUserTemplates() {
    const response = await fetch('/api/user/templates');
    if (!response.ok) throw new Error('Failed to fetch user templates');
    return response.json();
}

/**
 * Delete a template
 * @param {number} id - Template ID to delete
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If the API request fails
 */
export async function deleteTemplate(id) {
    const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete template');
    return response.json();
}

/**
 * Remove a vote from a template
 * @param {number} templateId - The ID of the template
 * @returns {Promise<{vote_count: number}>} The updated vote count
 * @throws {Error} If the API request fails
 */
export async function removeVote(templateId) {
    const response = await fetch(`/api/templates/${templateId}/vote`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to remove vote');
    }
    return response.json();
}