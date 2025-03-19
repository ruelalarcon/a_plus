export async function getCalculators() {
    const response = await fetch('/api/calculators');
    if (!response.ok) throw new Error('Failed to fetch calculators');
    return response.json();
}

export async function getCalculator(id) {
    const response = await fetch(`/api/calculators/${id}`);
    if (!response.ok) throw new Error('Failed to fetch calculator');
    return response.json();
}

export async function createCalculator(name) {
    const response = await fetch('/api/calculators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to create calculator');
    return response.json();
}

export async function updateCalculator(id, data) {
    const response = await fetch(`/api/calculators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update calculator');
    return response.json();
}

export async function deleteCalculator(id) {
    const response = await fetch(`/api/calculators/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete calculator');
    return response.json();
}

export async function publishTemplate(id, templateData) {
    const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
    });
    if (!response.ok) throw new Error('Failed to publish template');
    return response.json();
}