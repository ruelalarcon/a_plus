import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const db = new Database(process.env.DB_PATH);

// Initialize database
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	)
`);

export default db;
