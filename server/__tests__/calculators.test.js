import supertest from 'supertest';
import { app } from '../server.js';
import { createAuthenticatedUser } from './test-helpers.js';
import { clearAllTables } from '../db.js';

const request = supertest(app);

/**
 * Helper function to create a test calculator
 */
async function createCalculator(cookies, data = { name: 'Test Calculator' }) {
    const response = await request
        .post('/api/calculators')
        .set('Cookie', cookies)
        .send(data);

    return response.body;
}

describe('Calculators API', () => {
    let authCookies;

    beforeEach(async () => {
        // Clear database and create a unique test user
        clearAllTables();
        // Create a user and get auth cookies before each test
        authCookies = await createAuthenticatedUser('calcuser_' + Date.now());
    });

    describe('GET /api/calculators', () => {
        it('should return empty array when no calculators exist', async () => {
            const response = await request
                .get('/api/calculators')
                .set('Cookie', authCookies);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return calculators for authenticated user', async () => {
            // Create a calculator first
            await createCalculator(authCookies);

            const response = await request
                .get('/api/calculators')
                .set('Cookie', authCookies);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should require authentication', async () => {
            const response = await request.get('/api/calculators');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/calculators', () => {
        it('should create a new calculator', async () => {
            const calculatorData = {
                name: 'New Calculator',
                min_desired_grade: 85.5
            };

            const response = await request
                .post('/api/calculators')
                .set('Cookie', authCookies)
                .send(calculatorData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', calculatorData.name);
            expect(response.body).toHaveProperty('min_desired_grade', calculatorData.min_desired_grade);
        });
    });

    describe('PUT /api/calculators/:id', () => {
        let calculator;

        beforeEach(async () => {
            // Create a calculator to update
            calculator = await createCalculator(authCookies);
        });

        it('should update calculator name', async () => {
            const response = await request
                .put(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies)
                .send({ name: 'Updated Calculator' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Verify the update
            const getResponse = await request
                .get(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies);

            expect(getResponse.body.calculator).toHaveProperty('name', 'Updated Calculator');
        });

        it('should update calculator assessments', async () => {
            const assessments = [
                { name: 'Midterm', weight: 40, grade: 92 },
                { name: 'Final', weight: 60, grade: 88 }
            ];

            const response = await request
                .put(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies)
                .send({ assessments });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Verify the update
            const getResponse = await request
                .get(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies);

            expect(getResponse.body.assessments.length).toBe(2);
            expect(getResponse.body.assessments[0]).toHaveProperty('name', 'Midterm');
            expect(getResponse.body.assessments[0]).toHaveProperty('grade', 92);
        });

        it('should update both min_desired_grade and assessments in a single request', async () => {
            const updateData = {
                min_desired_grade: 85,
                assessments: [
                    { name: 'Quiz', weight: 20, grade: 90 },
                    { name: 'Midterm', weight: 30, grade: 88 },
                    { name: 'Final', weight: 50, grade: null }
                ]
            };

            const response = await request
                .put(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Verify both updates
            const getResponse = await request
                .get(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies);

            // Verify min_desired_grade was updated
            expect(getResponse.body.calculator).toHaveProperty('min_desired_grade', updateData.min_desired_grade);

            // Verify assessments were updated
            expect(getResponse.body.assessments.length).toBe(3);
            expect(getResponse.body.assessments[0]).toHaveProperty('name', 'Quiz');
            expect(getResponse.body.assessments[0]).toHaveProperty('grade', 90);
            expect(getResponse.body.assessments[1]).toHaveProperty('name', 'Midterm');
            expect(getResponse.body.assessments[2]).toHaveProperty('name', 'Final');
            expect(getResponse.body.assessments[2]).toHaveProperty('grade', null);
        });
    });

    describe('DELETE /api/calculators/:id', () => {
        it('should delete a calculator', async () => {
            // Create a calculator to delete
            const calculator = await createCalculator(authCookies);

            const response = await request
                .delete(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Verify deletion
            const getResponse = await request
                .get(`/api/calculators/${calculator.id}`)
                .set('Cookie', authCookies);

            expect(getResponse.status).toBe(404);
        });
    });
});