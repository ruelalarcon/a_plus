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
app.post("/api/register", async (req, res) => {
	const { username, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
		stmt.run(username, hashedPassword);
		res.json({ success: true });
	} catch (error) {
		res.status(400).json({ error: "Username already exists" });
	}
});

// Login endpoint
app.post("/api/login", async (req, res) => {
	const { username, password } = req.body;

	const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
	const user = stmt.get(username);

	if (user && (await bcrypt.compare(password, user.password))) {
		req.session.userId = user.id;
		res.json({ success: true });
	} else {
		res.status(401).json({ error: "Invalid credentials" });
	}
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
	req.session.destroy();
	res.json({ success: true });
});

// Add this new endpoint before app.listen
app.get("/api/user", (req, res) => {
	if (!req.session.userId) {
		return res.status(401).json({ error: "Not logged in" });
	}

	const stmt = db.prepare("SELECT username FROM users WHERE id = ?");
	const user = stmt.get(req.session.userId);
	res.json({ username: user.username });
});

// Update the client-side routing handler to use join
app.get('*', (req, res) => {
	res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
