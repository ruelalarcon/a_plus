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

export async function getTemplate(id) {
    const response = await fetch(`/api/templates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
}

export async function useTemplate(id) {
    const response = await fetch(`/api/templates/${id}/use`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to use template');
    return response.json();
}

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

export async function getTemplateComments(id) {
    const response = await fetch(`/api/templates/${id}/comments`);
    if (!response.ok) throw new Error('Failed to fetch template comments');
    return response.json();
}

export async function addTemplateComment(id, content) {
    const response = await fetch(`/api/templates/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
}

export async function updateTemplateComment(templateId, commentId, content) {
    const response = await fetch(`/api/templates/${templateId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
}

export async function deleteTemplateComment(templateId, commentId) {
    const response = await fetch(`/api/templates/${templateId}/comments/${commentId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return response.json();
}

export async function getUserTemplates() {
    const response = await fetch('/api/user/templates');
    if (!response.ok) throw new Error('Failed to fetch user templates');
    return response.json();
}

export async function deleteTemplate(id) {
    const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete template');
    return response.json();
}

/**
 * Remove a vote from a template
 * @param {number} templateId The ID of the template
 * @returns {Promise<{vote_count: number}>} The updated vote count
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