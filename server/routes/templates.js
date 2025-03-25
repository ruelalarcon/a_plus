/**
 * Templates Routes Module
 * Handles CRUD operations for calculator templates, template voting, and comments
 * @module routes/templates
 */

import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * Create a new template
 * @route POST /api/templates
 * @param {object} req.body - Request body
 * @param {string} req.body.name - Template name
 * @param {string} req.body.term - Academic term
 * @param {string} req.body.year - Academic year
 * @param {string} req.body.institution - Institution name
 * @param {object[]} req.body.assessments - Assessment structure array
 * @returns {object} Created template ID
 */
router.post('/', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { name, term, year, institution, assessments } = req.body;

    const db_transaction = db.transaction(() => {
        // Create template with initial vote count of 1
        const templateStmt = db.prepare(`
            INSERT INTO calculator_templates (user_id, name, term, year, institution, vote_count)
            VALUES (?, ?, ?, ?, ?, 1)
        `);
        const result = templateStmt.run(req.session.userId, name, term, year, institution);
        const templateId = result.lastInsertRowid;

        // Add creator's automatic upvote
        db.prepare(`
            INSERT INTO template_votes (template_id, user_id, vote)
            VALUES (?, ?, 1)
        `).run(templateId, req.session.userId);

        // Add assessments
        const assessmentStmt = db.prepare(`
            INSERT INTO template_assessments (template_id, name, weight)
            VALUES (?, ?, ?)
        `);

        for (const assessment of assessments) {
            assessmentStmt.run(templateId, assessment.name, assessment.weight);
        }

        return templateId;
    });

    const templateId = db_transaction();
    res.json({ id: templateId });
});

/**
 * Search for templates
 * @route GET /api/templates/search
 * @param {string} [req.query.query] - Search query for template name
 * @param {string} [req.query.term] - Academic term filter
 * @param {string} [req.query.year] - Academic year filter
 * @param {string} [req.query.institution] - Institution name filter
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=20] - Number of results per page
 * @returns {object} Templates, total count, page number, and limit
 */
router.get('/search', (req, res) => {
    const MAX_LIMIT = 100;
    const MIN_VOTES = -1;
    const { query, term, year, institution, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit), MAX_LIMIT);
    const offset = (page - 1) * safeLimit;

    // Query to get total count of matching templates
    const countQuery = db.prepare(`
        SELECT COUNT(*) as total
        FROM calculator_templates t
        WHERE
            (t.name LIKE ? OR            -- Match on name
            t.term LIKE ? OR             -- Match on term
            t.year = ? OR                -- Exact year match
            t.institution LIKE ?) AND    -- Match on institution
            t.vote_count >= ? AND        -- Minimum vote threshold
            t.deleted = 0                -- Exclude deleted templates
    `).get(
        `%${query || ''}%`,
        `%${term || ''}%`,
        year || 0,
        `%${institution || ''}%`,
        MIN_VOTES
    );

    // Complex search query with ranking
    let templates = db.prepare(`
        SELECT
            t.*,
            u.username as creator_name,
            COALESCE(v.vote, 0) as user_vote,
            (
                -- Calculate match score based on which fields match
                CASE
                    WHEN t.name LIKE ? THEN 1
                    ELSE 0
                END +
                CASE
                    WHEN t.term LIKE ? THEN 1
                    ELSE 0
                END +
                CASE
                    WHEN t.year = ? THEN 1
                    ELSE 0
                END +
                CASE
                    WHEN t.institution LIKE ? THEN 1
                    ELSE 0
                END
            ) as match_score
        FROM calculator_templates t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN template_votes v ON t.id = v.template_id AND v.user_id = ?
        WHERE
            -- Match any field
            (t.name LIKE ? OR
            t.term LIKE ? OR
            t.year = ? OR
            t.institution LIKE ?) AND
            t.vote_count >= ? AND
            t.deleted = 0
        -- Order by:
        -- 1. Number of matching fields
        -- 2. Institution match priority
        -- 3. Name match priority
        -- 4. Term match priority
        -- 5. Vote count
        -- 6. Most recent
        ORDER BY match_score DESC,
            CASE WHEN t.institution LIKE ? THEN 0 ELSE 1 END,
            CASE WHEN t.name LIKE ? THEN 0 ELSE 1 END,
            CASE WHEN t.term LIKE ? THEN 0 ELSE 1 END,
            t.vote_count DESC,
            t.created_at DESC
        LIMIT ? OFFSET ?
    `).all(
        `%${query || ''}%`,
        `%${term || ''}%`,
        year || 0,
        `%${institution || ''}%`,
        req.session.userId || 0,
        `%${query || ''}%`,
        `%${term || ''}%`,
        year || 0,
        `%${institution || ''}%`,
        MIN_VOTES,
        `%${institution || ''}%`,
        `%${query || ''}%`,
        `%${term || ''}%`,
        safeLimit,
        offset
    );

    // Get assessments for each template
    templates = templates.map(template => {
        const assessments = db.prepare(`
            SELECT * FROM template_assessments
            WHERE template_id = ?
        `).all(template.id);
        return { ...template, assessments };
    });

    res.json({
        templates,
        total: countQuery.total,
        page: Number(page),
        limit: Number(safeLimit)
    });
});

/**
 * Get templates created by the current user
 * @route GET /api/templates/user/templates
 * @returns {object[]} Array of user's templates with assessments
 */
router.get('/user/templates', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const templates = db.prepare(`
        SELECT t.*, u.username as creator_name,
            (
                SELECT COUNT(*)
                FROM template_comments c
                WHERE c.template_id = t.id
            ) as comment_count
        FROM calculator_templates t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ? AND t.deleted = 0
        ORDER BY t.created_at DESC
    `).all(req.session.userId);

    // Get assessments for each template
    const templatesWithAssessments = templates.map(template => {
        const assessments = db.prepare(`
            SELECT * FROM template_assessments
            WHERE template_id = ?
        `).all(template.id);
        return { ...template, assessments };
    });

    res.json(templatesWithAssessments);
});

/**
 * Get a specific template by ID
 * @route GET /api/templates/:id
 * @param {string} req.params.id - Template ID
 * @returns {object} Template with its assessments
 */
router.get('/:id', (req, res) => {
    const template = db.prepare(`
        SELECT t.*, u.username as creator_name
        FROM calculator_templates t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
    `).get(req.params.id);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    const assessments = db.prepare(`
        SELECT * FROM template_assessments
        WHERE template_id = ?
    `).all(template.id);

    res.json({ template, assessments });
});

/**
 * Create a calculator from a template
 * @route POST /api/templates/:id/use
 * @param {string} req.params.id - Template ID
 * @returns {object} Created calculator ID
 */
router.post('/:id/use', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const template = db.prepare(`
        SELECT * FROM calculator_templates
        WHERE id = ?
    `).get(req.params.id);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    const db_transaction = db.transaction(() => {
        // Create new calculator with template reference
        const calcStmt = db.prepare(`
            INSERT INTO calculators (user_id, name, template_id)
            VALUES (?, ?, ?)
        `);
        const result = calcStmt.run(req.session.userId, template.name, template.id);
        const calculatorId = result.lastInsertRowid;

        // Copy template assessments
        const assessments = db.prepare(`
            SELECT * FROM template_assessments
            WHERE template_id = ?
        `).all(template.id);

        const assessmentStmt = db.prepare(`
            INSERT INTO assessments (calculator_id, name, weight, grade)
            VALUES (?, ?, ?, NULL)
        `);

        for (const assessment of assessments) {
            assessmentStmt.run(calculatorId, assessment.name, assessment.weight);
        }

        return calculatorId;
    });

    const calculatorId = db_transaction();
    res.json({ id: calculatorId });
});

/**
 * Vote on a template
 * @route POST /api/templates/:id/vote
 * @param {string} req.params.id - Template ID
 * @param {object} req.body - Request body
 * @param {number} req.body.vote - Vote value (1 for upvote, -1 for downvote)
 * @returns {object} Updated vote count and user's vote
 */
router.post('/:id/vote', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { vote } = req.body;
    if (vote !== 1 && vote !== -1) {
        return res.status(400).json({ error: 'Invalid vote value' });
    }

    const template = db.prepare(`
        SELECT * FROM calculator_templates
        WHERE id = ?
    `).get(req.params.id);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    // Prevent voting on own templates
    if (template.user_id === req.session.userId) {
        return res.status(400).json({ error: 'Cannot vote on your own template' });
    }

    const db_transaction = db.transaction(() => {
        // Get existing vote if any
        const existingVote = db.prepare(`
            SELECT vote FROM template_votes
            WHERE template_id = ? AND user_id = ?
        `).get(template.id, req.session.userId);

        if (existingVote) {
            // Remove old vote from count first
            db.prepare(`
                UPDATE calculator_templates
                SET vote_count = vote_count - ?
                WHERE id = ?
            `).run(existingVote.vote, template.id);

            // Update to new vote
            db.prepare(`
                UPDATE template_votes
                SET vote = ?
                WHERE template_id = ? AND user_id = ?
            `).run(vote, template.id, req.session.userId);
        } else {
            // Insert new vote
            db.prepare(`
                INSERT INTO template_votes (template_id, user_id, vote)
                VALUES (?, ?, ?)
            `).run(template.id, req.session.userId, vote);
        }

        // Update template vote count
        db.prepare(`
            UPDATE calculator_templates
            SET vote_count = vote_count + ?
            WHERE id = ?
        `).run(vote, template.id);

        // Get new vote count
        return db.prepare(`
            SELECT vote_count FROM calculator_templates
            WHERE id = ?
        `).get(template.id).vote_count;
    });

    const newVoteCount = db_transaction();
    res.json({ vote_count: newVoteCount, user_vote: vote });
});

/**
 * Remove vote from a template
 * @route DELETE /api/templates/:id/vote
 * @param {string} req.params.id - Template ID
 * @returns {object} Updated vote count
 */
router.delete('/:id/vote', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const template = db.prepare(`
        SELECT * FROM calculator_templates
        WHERE id = ?
    `).get(req.params.id);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    // Prevent removing vote from own template (automatic upvote)
    if (template.user_id === req.session.userId) {
        return res.status(400).json({ error: 'Cannot remove vote from your own template' });
    }

    const db_transaction = db.transaction(() => {
        // Get existing vote
        const existingVote = db.prepare(`
            SELECT vote FROM template_votes
            WHERE template_id = ? AND user_id = ?
        `).get(template.id, req.session.userId);

        if (existingVote) {
            // Remove vote from count
            db.prepare(`
                UPDATE calculator_templates
                SET vote_count = vote_count - ?
                WHERE id = ?
            `).run(existingVote.vote, template.id);

            // Delete vote record
            db.prepare(`
                DELETE FROM template_votes
                WHERE template_id = ? AND user_id = ?
            `).run(template.id, req.session.userId);
        }

        // Get updated vote count
        return db.prepare(`
            SELECT vote_count FROM calculator_templates
            WHERE id = ?
        `).get(template.id).vote_count;
    });

    const newVoteCount = db_transaction();
    res.json({ vote_count: newVoteCount });
});

/**
 * Get comments for a template
 * @route GET /api/templates/:id/comments
 * @param {string} req.params.id - Template ID
 * @returns {object[]} Array of comments with usernames
 */
router.get('/:id/comments', (req, res) => {
    const comments = db.prepare(`
        SELECT c.*, u.username
        FROM template_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.template_id = ?
        ORDER BY c.created_at DESC
    `).all(req.params.id);

    res.json(comments);
});

/**
 * Add a comment to a template
 * @route POST /api/templates/:id/comments
 * @param {string} req.params.id - Template ID
 * @param {object} req.body - Request body
 * @param {string} req.body.content - Comment content
 * @returns {object} Created comment with username and timestamps
 */
router.post('/:id/comments', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const template = db.prepare(`
        SELECT * FROM calculator_templates WHERE id = ?
    `).get(req.params.id);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const result = db.prepare(`
        INSERT INTO template_comments (template_id, user_id, content)
        VALUES (?, ?, ?)
    `).run(template.id, req.session.userId, content.trim());

    const comment = db.prepare(`
        SELECT c.*, u.username
        FROM template_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json(comment);
});

/**
 * Update a comment
 * @route PUT /api/templates/:templateId/comments/:commentId
 * @param {string} req.params.templateId - Template ID
 * @param {string} req.params.commentId - Comment ID
 * @param {object} req.body - Request body
 * @param {string} req.body.content - Updated comment content
 * @returns {object} Updated comment with username and timestamps
 */
router.put('/:templateId/comments/:commentId', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const comment = db.prepare(`
        SELECT * FROM template_comments
        WHERE id = ? AND template_id = ?
    `).get(req.params.commentId, req.params.templateId);

    if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.session.userId) {
        return res.status(403).json({ error: 'Cannot edit other users\' comments' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    db.prepare(`
        UPDATE template_comments
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(content.trim(), comment.id);

    const updatedComment = db.prepare(`
        SELECT c.*, u.username
        FROM template_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    `).get(comment.id);

    res.json(updatedComment);
});

/**
 * Delete a comment
 * @route DELETE /api/templates/:templateId/comments/:commentId
 * @param {string} req.params.templateId - Template ID
 * @param {string} req.params.commentId - Comment ID
 * @returns {object} Success message
 */
router.delete('/:templateId/comments/:commentId', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const comment = db.prepare(`
        SELECT * FROM template_comments
        WHERE id = ? AND template_id = ?
    `).get(req.params.commentId, req.params.templateId);

    if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.session.userId) {
        return res.status(403).json({ error: 'Cannot delete other users\' comments' });
    }

    db.prepare('DELETE FROM template_comments WHERE id = ?').run(comment.id);
    res.json({ success: true });
});

/**
 * Soft delete a template
 * @route DELETE /api/templates/:id
 * @param {string} req.params.id - Template ID
 * @returns {object} Success message
 */
router.delete('/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const template = db.prepare(`
        SELECT * FROM calculator_templates
        WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    // Mark template as deleted
    db.prepare(`
        UPDATE calculator_templates
        SET deleted = 1
        WHERE id = ?
    `).run(template.id);

    res.json({ success: true });
});

export default router;