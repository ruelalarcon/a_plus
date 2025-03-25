/**
 * Courses Routes Module
 * Handles CRUD operations for user courses and their prerequisites
 * @module routes/courses
 */

import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * Get all courses for the current user with prerequisites
 * @route GET /api/courses
 * @returns {object[]} Array of user's courses with prerequisites
 */
router.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const courses = db.prepare(`
        SELECT * FROM courses
        WHERE user_id = ?
        ORDER BY created_at ASC
    `).all(req.session.userId);

    // Get prerequisites for each course
    const coursesWithPrereqs = courses.map(course => {
        const prerequisites = db.prepare(`
            SELECT c.* FROM courses c
            JOIN course_prerequisites p ON c.id = p.prerequisite_id
            WHERE p.course_id = ?
        `).all(course.id);
        return { ...course, prerequisites };
    });

    res.json(coursesWithPrereqs);
});

/**
 * Add a new course
 * @route POST /api/courses
 * @param {object} req.body - Request body
 * @param {string} req.body.name - Course name
 * @param {number[]} [req.body.prerequisiteIds=[]] - Array of prerequisite course IDs
 * @returns {object} Created course with prerequisites
 */
router.post('/', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { name, prerequisiteIds = [] } = req.body;

    const db_transaction = db.transaction(() => {
        // Create course
        const courseStmt = db.prepare(`
            INSERT INTO courses (user_id, name)
            VALUES (?, ?)
        `);
        const result = courseStmt.run(req.session.userId, name);
        const courseId = result.lastInsertRowid;

        // Add prerequisites
        if (prerequisiteIds.length > 0) {
            const prereqStmt = db.prepare(`
                INSERT INTO course_prerequisites (course_id, prerequisite_id)
                VALUES (?, ?)
            `);
            for (const prereqId of prerequisiteIds) {
                prereqStmt.run(courseId, prereqId);
            }
        }

        // Return the new course with its prerequisites
        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        const prerequisites = db.prepare(`
            SELECT c.* FROM courses c
            JOIN course_prerequisites p ON c.id = p.prerequisite_id
            WHERE p.course_id = ?
        `).all(courseId);

        return { ...course, prerequisites };
    });

    const newCourse = db_transaction();
    res.json(newCourse);
});

/**
 * Update a course
 * @route PUT /api/courses/:id
 * @param {string} req.params.id - Course ID
 * @param {object} req.body - Request body
 * @param {string} [req.body.name] - Updated course name
 * @param {boolean} [req.body.completed] - Course completion status
 * @param {number[]} [req.body.prerequisiteIds] - Updated array of prerequisite course IDs
 * @returns {object} Updated course with prerequisites
 */
router.put('/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { name, completed, prerequisiteIds } = req.body;

    const course = db.prepare(`
        SELECT * FROM courses
        WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    const db_transaction = db.transaction(() => {
        // Update course details
        if (name !== undefined || completed !== undefined) {
            const updates = [];
            const params = [];
            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (completed !== undefined) {
                updates.push('completed = ?');
                params.push(completed ? 1 : 0);
            }
            params.push(course.id);

            db.prepare(`
                UPDATE courses
                SET ${updates.join(', ')}
                WHERE id = ?
            `).run(...params);
        }

        // Update prerequisites if provided
        if (prerequisiteIds !== undefined) {
            // Remove existing prerequisites
            db.prepare('DELETE FROM course_prerequisites WHERE course_id = ? OR prerequisite_id = ?')
                .run(course.id, course.id);

            // Add new prerequisites
            if (prerequisiteIds.length > 0) {
                const prereqStmt = db.prepare(`
                    INSERT INTO course_prerequisites (course_id, prerequisite_id)
                    VALUES (?, ?)
                `);
                for (const prereqId of prerequisiteIds) {
                    prereqStmt.run(course.id, prereqId);
                }
            }
        }

        // Return updated course with prerequisites
        const updatedCourse = db.prepare('SELECT * FROM courses WHERE id = ?')
            .get(course.id);
        const prerequisites = db.prepare(`
            SELECT c.* FROM courses c
            JOIN course_prerequisites p ON c.id = p.prerequisite_id
            WHERE p.course_id = ?
        `).all(course.id);

        return { ...updatedCourse, prerequisites };
    });

    const updatedCourse = db_transaction();
    res.json(updatedCourse);
});

/**
 * Delete a course
 * @route DELETE /api/courses/:id
 * @param {string} req.params.id - Course ID
 * @returns {object} Success message
 */
router.delete('/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const course = db.prepare(`
        SELECT * FROM courses
        WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    const db_transaction = db.transaction(() => {
        // Delete prerequisites first
        db.prepare('DELETE FROM course_prerequisites WHERE course_id = ? OR prerequisite_id = ?')
            .run(course.id, course.id);
        // Then delete the course
        db.prepare('DELETE FROM courses WHERE id = ?')
            .run(course.id);
    });

    db_transaction();
    res.json({ success: true });
});

export default router;