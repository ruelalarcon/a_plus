import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database.sqlite'));

// Create tables if they don't exist
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	)
`);

db.exec(`
	CREATE TABLE IF NOT EXISTS calculators (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id)
	)
`);

db.exec(`
	CREATE TABLE IF NOT EXISTS assessments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		calculator_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		weight DECIMAL(5,2) NOT NULL,
		grade DECIMAL(5,2),
		FOREIGN KEY (calculator_id) REFERENCES calculators (id)
	)
`);

db.exec(`
	CREATE TABLE IF NOT EXISTS calculator_templates (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		term TEXT NOT NULL,
		year INTEGER NOT NULL,
		institution TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id)
	)
`);

db.exec(`
	CREATE TABLE IF NOT EXISTS template_assessments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		template_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		weight DECIMAL(5,2) NOT NULL,
		FOREIGN KEY (template_id) REFERENCES calculator_templates (id)
	)
`);

export default db;
