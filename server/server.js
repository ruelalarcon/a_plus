import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("dist"));
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

// Register endpoint
app.post('/api/register', async (req, res) => {
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

// Login endpoint
app.post('/api/login', async (req, res) => {
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

// Logout endpoint
app.post('/api/logout', (req, res) => {
	req.session.destroy();
	res.json({ success: true });
});

// Update the user endpoint to include userId
app.get('/api/user', (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Not logged in' });
	}

	const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
	const user = stmt.get(req.session.userId);
	res.json({ userId: user.id, username: user.username });
});

// Get user's calculators
app.get('/api/calculators', (req, res) => {
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

// Create new calculator
app.post('/api/calculators', (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: 'Not logged in' });
	}

	const stmt = db.prepare('INSERT INTO calculators (user_id, name) VALUES (?, ?)');
	const result = stmt.run(req.session.userId, req.body.name);
	res.json({ id: result.lastInsertRowid, name: req.body.name });
});

// Get specific calculator with assessments
app.get('/api/calculators/:id', (req, res) => {
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

	const assessments = db.prepare(`
		SELECT * FROM assessments
		WHERE calculator_id = ?
	`).all(req.params.id);

	res.json({ calculator, assessments });
});

// Update calculator assessments
app.put('/api/calculators/:id', (req, res) => {
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
	res.json({ success: true });
});

// Delete calculator
app.delete('/api/calculators/:id', async (req, res) => {
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

// Update the client-side routing handler to use join
app.get('*', (req, res) => {
	res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
