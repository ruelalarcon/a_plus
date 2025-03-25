import supertest from 'supertest';
import { app } from '../server.js';
import { clearAllTables } from '../db.js';

// Set environment to test
process.env.NODE_ENV = 'test';

const request = supertest(app);

describe('Authentication API', () => {
    const testUser = {
        username: 'testuser',
        password: 'password123'
    };

    beforeEach(async () => {
        // Clear database before each test
        clearAllTables();
    });

    describe('POST /api/register', () => {
        it('should register a new user', async () => {
            const response = await request
                .post('/api/register')
                .send(testUser);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should return error if username already exists', async () => {
            // First registration
            await request
                .post('/api/register')
                .send(testUser);

            // Second registration with same username
            const response = await request
                .post('/api/register')
                .send(testUser);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/login', () => {
        beforeEach(async () => {
            // Register user before testing login
            await request
                .post('/api/register')
                .send(testUser);
        });

        it('should login with correct credentials', async () => {
            const response = await request
                .post('/api/login')
                .send(testUser);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should reject invalid credentials', async () => {
            const response = await request
                .post('/api/login')
                .send({
                    username: testUser.username,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/user', () => {
        it('should return user info when logged in', async () => {
            // Register and login
            await request.post('/api/register').send(testUser);
            const loginResponse = await request.post('/api/login').send(testUser);

            // Get cookie from login response
            const cookies = loginResponse.headers['set-cookie'];

            // Use cookie in user info request
            const response = await request
                .get('/api/user')
                .set('Cookie', cookies);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('username', testUser.username);
            expect(response.body).toHaveProperty('userId');
        });

        it('should return 401 when not logged in', async () => {
            const response = await request.get('/api/user');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });
});