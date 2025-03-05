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

	if (req.body.name !== undefined) {
		// Update name
		db.prepare('UPDATE calculators SET name = ? WHERE id = ?')
			.run(req.body.name, calculator.id);
	} else if (req.body.assessments) {
		// Update assessments
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

// Publish calculator as template
app.post('/api/templates', (req, res) => {
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

// Search templates
app.get('/api/templates/search', (req, res) => {
	const MAX_LIMIT = 100;
	const MIN_VOTES = -1;
	const { query, term, year, institution, page = 1, limit = 20 } = req.query;
	const safeLimit = Math.min(Number(limit), MAX_LIMIT);
	const offset = (page - 1) * safeLimit;

	// First get total count
	const countQuery = db.prepare(`
		SELECT COUNT(*) as total
		FROM calculator_templates t
		WHERE
			(t.name LIKE ? OR
			t.term LIKE ? OR
			t.year = ? OR
			t.institution LIKE ?) AND
			t.vote_count >= ?
	`).get(
		`%${query || ''}%`,
		`%${term || ''}%`,
		year || 0,
		`%${institution || ''}%`,
		MIN_VOTES
	);

	// Then get paginated results
	let templates = db.prepare(`
		SELECT
			t.*,
			u.username as creator_name,
			COALESCE(v.vote, 0) as user_vote,
			(
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
			(t.name LIKE ? OR
			t.term LIKE ? OR
			t.year = ? OR
			t.institution LIKE ?) AND
			t.vote_count >= ?
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

// Get specific template
app.get('/api/templates/:id', (req, res) => {
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

// Create calculator from template
app.post('/api/templates/:id/use', (req, res) => {
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
		// Create new calculator
		const calcStmt = db.prepare(`
			INSERT INTO calculators (user_id, name)
			VALUES (?, ?)
		`);
		const result = calcStmt.run(req.session.userId, template.name);
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

// Vote on a template
app.post('/api/templates/:id/vote', (req, res) => {
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
			// Remove old vote from count
			db.prepare(`
				UPDATE calculator_templates
				SET vote_count = vote_count - ?
				WHERE id = ?
			`).run(existingVote.vote, template.id);

			// Update vote
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

		// Get updated vote count
		return db.prepare(`
			SELECT vote_count FROM calculator_templates
			WHERE id = ?
		`).get(template.id).vote_count;
	});

	const newVoteCount = db_transaction();
	res.json({ vote_count: newVoteCount, user_vote: vote });
});

// Remove vote from template
app.delete('/api/templates/:id/vote', (req, res) => {
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

// Update the client-side routing handler to use join
app.get('*', (req, res) => {
	res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
