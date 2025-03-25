import supertest from 'supertest';
import { app } from '../server.js';
import { createAuthenticatedUser } from './test-helpers.js';
import { clearAllTables } from '../db.js';

const request = supertest(app);

/**
 * Helper function to create a test course
 */
async function createCourse(cookies, data = { name: 'Test Course' }) {
    const response = await request
        .post('/api/courses')
        .set('Cookie', cookies)
        .send(data);

    return response.body;
}

describe('Courses API', () => {
    let authCookies;

    beforeEach(async () => {
        // Clear database and create a unique test user
        clearAllTables();
        // Create a user and get auth cookies before each test
        authCookies = await createAuthenticatedUser('courseuser_' + Date.now());
    });

    describe('GET /api/courses', () => {
        it('should return empty array when no courses exist', async () => {
            const response = await request
                .get('/api/courses')
                .set('Cookie', authCookies);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return courses for authenticated user', async () => {
            // Create a course first
            await createCourse(authCookies);

            const response = await request
                .get('/api/courses')
                .set('Cookie', authCookies);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0]).toHaveProperty('name', 'Test Course');
            expect(response.body[0]).toHaveProperty('prerequisites');
        });

        it('should require authentication', async () => {
            const response = await request.get('/api/courses');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/courses', () => {
        it('should create a new course', async () => {
            const courseData = {
                name: 'New Course'
            };

            const response = await request
                .post('/api/courses')
                .set('Cookie', authCookies)
                .send(courseData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', courseData.name);
            expect(response.body).toHaveProperty('prerequisites');
            expect(response.body.prerequisites).toEqual([]);
        });

        it('should create a course with prerequisites', async () => {
            // Create prerequisites first
            const prereq1 = await createCourse(authCookies, { name: 'Prerequisite 1' });
            const prereq2 = await createCourse(authCookies, { name: 'Prerequisite 2' });

            const courseData = {
                name: 'Advanced Course',
                prerequisiteIds: [prereq1.id, prereq2.id]
            };

            const response = await request
                .post('/api/courses')
                .set('Cookie', authCookies)
                .send(courseData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('prerequisites');
            expect(response.body.prerequisites.length).toBe(2);
        });
    });

    describe('PUT /api/courses/:id', () => {
        let course;

        beforeEach(async () => {
            // Create a course to update
            course = await createCourse(authCookies);
        });

        it('should update course name', async () => {
            const response = await request
                .put(`/api/courses/${course.id}`)
                .set('Cookie', authCookies)
                .send({ name: 'Updated Course' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name', 'Updated Course');
        });

        it('should mark course as completed', async () => {
            const response = await request
                .put(`/api/courses/${course.id}`)
                .set('Cookie', authCookies)
                .send({ completed: 1 });  // Using completed: 1 instead of true because SQLite stores booleans as integers (0/1)

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('completed', 1);
        });

        it('should update course prerequisites', async () => {
            // Create a prerequisite
            const prereq = await createCourse(authCookies, { name: 'Prerequisite Course' });

            const response = await request
                .put(`/api/courses/${course.id}`)
                .set('Cookie', authCookies)
                .send({ prerequisiteIds: [prereq.id] });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('prerequisites');
            expect(response.body.prerequisites.length).toBe(1);
            expect(response.body.prerequisites[0].name).toBe('Prerequisite Course');
        });
    });

    describe('DELETE /api/courses/:id', () => {
        it('should delete a course', async () => {
            // Create a course to delete
            const course = await createCourse(authCookies);

            const response = await request
                .delete(`/api/courses/${course.id}`)
                .set('Cookie', authCookies);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Verify course is deleted
            const getResponse = await request
                .get('/api/courses')
                .set('Cookie', authCookies);

            expect(getResponse.body.length).toBe(0);
        });

        it('should delete prerequisites when course is deleted', async () => {
            // Create two courses
            const course1 = await createCourse(authCookies, { name: 'Course 1' });
            const course2 = await createCourse(authCookies, { name: 'Course 2' });

            // Make course2 depend on course1
            await request
                .put(`/api/courses/${course2.id}`)
                .set('Cookie', authCookies)
                .send({ prerequisiteIds: [course1.id] });

            // Delete course1
            await request
                .delete(`/api/courses/${course1.id}`)
                .set('Cookie', authCookies);

            // Get course2 and verify it no longer has prerequisites
            const getResponse = await request
                .get('/api/courses')
                .set('Cookie', authCookies);

            // Only course2 should remain
            expect(getResponse.body.length).toBe(1);
            expect(getResponse.body[0].prerequisites.length).toBe(0);
        });
    });
});