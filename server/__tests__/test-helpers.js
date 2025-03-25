import supertest from 'supertest';
import { app } from '../server.js';

const request = supertest(app);

/**
 * Creates a test user and returns the authentication cookie
 * @param {string} username - Username for the test user
 * @returns {Promise<string[]>} - Cookie headers for authenticated requests
 */
export async function createAuthenticatedUser(username = 'testuser') {
    const userCredentials = {
        username,
        password: 'password123'
    };

    try {
        // Register user - ignore if already exists
        await request
            .post('/api/register')
            .send(userCredentials);
    } catch (error) {
        // Ignore registration errors
    }

    // Login user
    const loginResponse = await request
        .post('/api/login')
        .send(userCredentials);

    // Return the cookies for authenticated requests
    return loginResponse.headers['set-cookie'];
}

/**
 * Creates a test calculator
 * @param {string[]} cookies - Authentication cookies
 * @param {object} calculatorData - Calculator data
 * @returns {Promise<object>} - Created calculator
 */
export async function createTestCalculator(cookies, calculatorData = { name: 'Test Calculator' }) {
    const response = await request
        .post('/api/calculators')
        .set('Cookie', cookies)
        .send(calculatorData);

    return response.body;
}

/**
 * Creates a test template
 * @param {string[]} cookies - Authentication cookies
 * @param {object} templateData - Template data
 * @returns {Promise<object>} - Created template
 */
export async function createTestTemplate(cookies, templateData = {}) {
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
        .send({ ...defaultData, ...templateData });

    return response.body;
}

/**
 * Creates a test course
 * @param {string[]} cookies - Authentication cookies
 * @param {object} courseData - Course data
 * @returns {Promise<object>} - Created course
 */
export async function createTestCourse(cookies, courseData = { name: 'Test Course' }) {
    const response = await request
        .post('/api/courses')
        .set('Cookie', cookies)
        .send(courseData);

    return response.body;
}

// Add a dummy test
describe('Test helpers', () => {
    test('should exist', () => {
        expect(typeof createAuthenticatedUser).toBe('function');
    });
});