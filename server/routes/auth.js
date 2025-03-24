/**
 * Authentication Routes Module
 * Handles user registration, login, logout, and retrieving user information
 * @module routes/auth
 */

import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';

const router = express.Router();

/**
 * Register a new user
 * @route POST /api/register
 * @param {object} req.body - Request body
 * @param {string} req.body.username - User's username
 * @param {string} req.body.password - User's password (will be hashed)
 * @returns {object} Success message or error
 */
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        stmt.run(username, hashedPassword);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

/**
 * Log in an existing user
 * @route POST /api/login
 * @param {object} req.body - Request body
 * @param {string} req.body.username - User's username
 * @param {string} req.body.password - User's password
 * @returns {object} Success message or error
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (user && (await bcrypt.compare(password, user.password))) {
        req.session.userId = user.id;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

/**
 * Log out the current user
 * @route POST /api/logout
 * @returns {object} Success message
 */
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

/**
 * Get current user information
 * @route GET /api/user
 * @returns {object} User ID and username or error if not logged in
 */
router.get('/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
    const user = stmt.get(req.session.userId);
    res.json({ userId: user.id, username: user.username });
});

export default router;