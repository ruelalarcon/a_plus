import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database.sqlite'));

// Create users table to store authentication info
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,  -- Username must be unique
		password TEXT NOT NULL          -- Stores hashed passwords
	)
`);

// Create calculators table to store user's grade calculators
// Can optionally be based on a template
db.exec(`
	CREATE TABLE IF NOT EXISTS calculators (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,       -- Owner of the calculator
		name TEXT NOT NULL,             -- Display name
		template_id INTEGER,            -- Optional reference to template it was created from
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id),
		FOREIGN KEY (template_id) REFERENCES calculator_templates (id)
	)
`);

// Store individual assessment items (assignments, tests etc) for each calculator
db.exec(`
	CREATE TABLE IF NOT EXISTS assessments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		calculator_id INTEGER NOT NULL,  -- Calculator this assessment belongs to
		name TEXT NOT NULL,              -- Name of assessment
		weight DECIMAL(5,2) NOT NULL,    -- Weight as percentage (e.g. 25.00)
		grade DECIMAL(5,2),              -- Optional grade received
		FOREIGN KEY (calculator_id) REFERENCES calculators (id)
	)
`);

// Store reusable calculator templates that users can share
db.exec(`
	CREATE TABLE IF NOT EXISTS calculator_templates (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,        -- Creator of template
		name TEXT NOT NULL,              -- Template name
		term TEXT NOT NULL,              -- Academic term (e.g. Fall, Spring)
		year INTEGER NOT NULL,           -- Academic year
		institution TEXT NOT NULL,       -- School/university name
		vote_count INTEGER DEFAULT 1,    -- Net votes (starts at 1 for creator's vote)
		deleted BOOLEAN DEFAULT 0,       -- Soft delete flag
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id)
	)
`);

// Track user votes on templates
db.exec(`
	CREATE TABLE IF NOT EXISTS template_votes (
		template_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		vote INTEGER NOT NULL CHECK (vote IN (-1, 1)), -- Upvote (1) or downvote (-1)
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (template_id, user_id),            -- One vote per user per template
		FOREIGN KEY (template_id) REFERENCES calculator_templates (id),
		FOREIGN KEY (user_id) REFERENCES users (id)
	)
`);

// Store assessment structure for templates
db.exec(`
	CREATE TABLE IF NOT EXISTS template_assessments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		template_id INTEGER NOT NULL,    -- Template this assessment belongs to
		name TEXT NOT NULL,              -- Assessment name
		weight DECIMAL(5,2) NOT NULL,    -- Weight as percentage
		FOREIGN KEY (template_id) REFERENCES calculator_templates (id)
	)
`);

// Store user comments on templates
db.exec(`
	CREATE TABLE IF NOT EXISTS template_comments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		template_id INTEGER NOT NULL,    -- Template being commented on
		user_id INTEGER NOT NULL,        -- Comment author
		content TEXT NOT NULL,           -- Comment text
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- For edited comments
		FOREIGN KEY (template_id) REFERENCES calculator_templates (id),
		FOREIGN KEY (user_id) REFERENCES users (id)
	)
`);

// Store user's courses for prerequisite tracking
db.exec(`
	CREATE TABLE IF NOT EXISTS courses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,        -- Course owner
		name TEXT NOT NULL,              -- Course name
		completed BOOLEAN DEFAULT 0,     -- Track completion status
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id)
	)
`);

// Track prerequisites between courses
db.exec(`
	CREATE TABLE IF NOT EXISTS course_prerequisites (
		course_id INTEGER NOT NULL,       -- The course that has prerequisites
		prerequisite_id INTEGER NOT NULL, -- The course that must be completed first
		PRIMARY KEY (course_id, prerequisite_id), -- Each prerequisite pair is unique
		FOREIGN KEY (course_id) REFERENCES courses (id),
		FOREIGN KEY (prerequisite_id) REFERENCES courses (id)
	)
`);

export default db;
