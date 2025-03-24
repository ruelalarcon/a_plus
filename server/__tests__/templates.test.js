import supertest from 'supertest';
import { app } from '../server.js';
import { createAuthenticatedUser } from './test-helpers.js';
import { clearAllTables } from '../db.js';

const request = supertest(app);

/**
 * Helper function to create a test template
 */
async function createTemplate(cookies, data = {}) {
    const defaultData = {
        name: 'Test Template',
        term: 'Fall',
        year: 2023,
        institution: 'Test University',
        assessments: [
            { name: 'Midterm', weight: 30 },
            { name: 'Final', weight: 70 }
        ]
    };

    const response = await request
        .post('/api/templates')
        .set('Cookie', cookies)
        .send({ ...defaultData, ...data });

    return response.body;
}

describe('Templates API', () => {
    let authCookies;

    beforeEach(async () => {
        // Clear database and create a unique test user
        clearAllTables();
        // Create a user and get auth cookies before each test
        authCookies = await createAuthenticatedUser('templateuser_' + Date.now());
    });

    describe('POST /api/templates', () => {
        it('should create a new template', async () => {
            const templateData = {
                name: 'New Template',
                term: 'Winter',
                year: 2024,
                institution: 'University of Testing',
                assessments: [
                    { name: 'Assignment 1', weight: 20 },
                    { name: 'Assignment 2', weight: 20 },
                    { name: 'Final Exam', weight: 60 }
                ]
            };

            const response = await request
                .post('/api/templates')
                .set('Cookie', authCookies)
                .send(templateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
        });

        it('should require authentication', async () => {
            const response = await request
                .post('/api/templates')
                .send({
                    name: 'Test Template',
                    term: 'Fall',
                    year: 2023,
                    institution: 'Test University',
                    assessments: []
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/templates/search', () => {
        beforeEach(async () => {
            // Create some templates for searching
            await createTemplate(authCookies, {
                name: 'Math 101',
                term: 'Fall',
                year: 2023,
                institution: 'University A'
            });

            await createTemplate(authCookies, {
                name: 'Computer Science 200',
                term: 'Winter',
                year: 2024,
                institution: 'University B'
            });
        });

        it('should search templates by query', async () => {
            const response = await request
                .get('/api/templates/search?query=math');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('templates');
            expect(response.body.templates.length).toBeGreaterThan(0);
            expect(response.body.templates[0].name).toContain('Math');
        });

        it('should search templates by institution', async () => {
            const response = await request
                .get('/api/templates/search?institution=University B');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('templates');
            expect(response.body.templates.length).toBeGreaterThan(0);
            expect(response.body.templates[0].institution).toContain('University B');
        });
    });

    describe('POST /api/templates/:id/vote', () => {
        let templateId;
        let secondUserCookies;

        beforeEach(async () => {
            // Create a template
            const template = await createTemplate(authCookies);
            templateId = template.id;

            // Create a second user for voting
            secondUserCookies = await createAuthenticatedUser('voter_' + Date.now());
        });

        it('should upvote a template', async () => {
            const response = await request
                .post(`/api/templates/${templateId}/vote`)
                .set('Cookie', secondUserCookies)
                .send({ vote: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('vote_count', 2); // Creator's vote (1) + upvote (1)
            expect(response.body).toHaveProperty('user_vote', 1);
        });

        it('should not allow voting on own template', async () => {
            const response = await request
                .post(`/api/templates/${templateId}/vote`)
                .set('Cookie', authCookies) // Original creator
                .send({ vote: 1 });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/templates/:id/comments', () => {
        let templateId;

        beforeEach(async () => {
            // Create a template
            const template = await createTemplate(authCookies);
            templateId = template.id;
        });

        it('should add a comment to a template', async () => {
            const commentData = { content: 'This is a test comment.' };

            const response = await request
                .post(`/api/templates/${templateId}/comments`)
                .set('Cookie', authCookies)
                .send(commentData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('content', commentData.content);
            expect(response.body).toHaveProperty('username');
        });
    });
});