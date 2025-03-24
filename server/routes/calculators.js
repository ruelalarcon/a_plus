/**
 * Calculator Routes Module
 * Handles CRUD operations for grade calculators
 * @module routes/calculators
 */

import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * Get all calculators for the current user
 * @route GET /api/calculators
 * @returns {object[]} Array of calculators with their assessments
 */
router.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const calculators = db.prepare(`
        SELECT * FROM calculators
        WHERE user_id = ?
    `).all(req.session.userId);

    // Get assessments for each calculator
    const calculatorsWithAssessments = calculators.map(calc => {
        const assessments = db.prepare(`
            SELECT * FROM assessments
            WHERE calculator_id = ?
        `).all(calc.id);
        return { ...calc, assessments };
    });

    res.json(calculatorsWithAssessments);
});

/**
 * Create a new calculator
 * @route POST /api/calculators
 * @param {object} req.body - Request body
 * @param {string} req.body.name - Calculator name
 * @param {number} [req.body.min_desired_grade] - Minimum desired grade (optional)
 * @returns {object} Created calculator object
 */
router.post('/', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const stmt = db.prepare('INSERT INTO calculators (user_id, name, min_desired_grade) VALUES (?, ?, ?)');
    const result = stmt.run(req.session.userId, req.body.name, req.body.min_desired_grade || null);
    res.json({ id: result.lastInsertRowid, name: req.body.name, min_desired_grade: req.body.min_desired_grade || null });
});

/**
 * Get a specific calculator by ID
 * @route GET /api/calculators/:id
 * @param {string} req.params.id - Calculator ID
 * @returns {object} Calculator with its assessments
 */
router.get('/:id', (req, res) => {
    const calculator = db.prepare(`
        SELECT c.*, t.id as template_id, t.name as template_name,
               t.user_id as template_user_id,
               COALESCE(v.vote, 0) as user_vote, t.vote_count
        FROM calculators c
        LEFT JOIN calculator_templates t ON c.template_id = t.id
        LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
        WHERE c.id = ? AND c.user_id = ?
    `).get(req.session.userId || 0, req.params.id, req.session.userId);

    if (!calculator) {
        return res.status(404).json({ error: 'Calculator not found' });
    }

    const assessments = db.prepare(`
        SELECT * FROM assessments
        WHERE calculator_id = ?
    `).all(calculator.id);

    res.json({ calculator, assessments });
});

/**
 * Update a calculator
 * @route PUT /api/calculators/:id
 * @param {string} req.params.id - Calculator ID
 * @param {object} req.body - Request body
 * @param {string} [req.body.name] - New calculator name
 * @param {number} [req.body.min_desired_grade] - New minimum desired grade
 * @param {object[]} [req.body.assessments] - New assessments array
 * @returns {object} Success message
 */
router.put('/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const calculator = db.prepare(`
        SELECT * FROM calculators
        WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    if (!calculator) {
        return res.status(404).json({ error: 'Calculator not found' });
    }

    // Update name and/or min_desired_grade if provided
    if (req.body.name !== undefined || req.body.min_desired_grade !== undefined) {
        const updates = [];
        const params = [];
        if (req.body.name !== undefined) {
            updates.push('name = ?');
            params.push(req.body.name);
        }
        if (req.body.min_desired_grade !== undefined) {
            updates.push('min_desired_grade = ?');
            params.push(req.body.min_desired_grade);
        }
        params.push(calculator.id);

        db.prepare(`
            UPDATE calculators
            SET ${updates.join(', ')}
            WHERE id = ?
        `).run(...params);
    }

    // Update assessments if provided
    if (req.body.assessments) {
        const db_transaction = db.transaction((assessments) => {
            // Delete existing assessments
            db.prepare('DELETE FROM assessments WHERE calculator_id = ?').run(calculator.id);

            // Insert new assessments
            const insertStmt = db.prepare(`
                INSERT INTO assessments (calculator_id, name, weight, grade)
                VALUES (?, ?, ?, ?)
            `);

            for (const assessment of assessments) {
                insertStmt.run(calculator.id, assessment.name, assessment.weight, assessment.grade);
            }
        });

        db_transaction(req.body.assessments);
    }

    res.json({ success: true });
});

/**
 * Delete a calculator
 * @route DELETE /api/calculators/:id
 * @param {string} req.params.id - Calculator ID
 * @returns {object} Success message
 */
router.delete('/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const calculator = db.prepare(`
        SELECT * FROM calculators
        WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    if (!calculator) {
        return res.status(404).json({ error: 'Calculator not found' });
    }

    const db_transaction = db.transaction(() => {
        // Delete assessments first due to foreign key constraint
        db.prepare('DELETE FROM assessments WHERE calculator_id = ?').run(calculator.id);
        // Then delete the calculator
        db.prepare('DELETE FROM calculators WHERE id = ?').run(calculator.id);
    });

    db_transaction();
    res.json({ success: true });
});

export default router;