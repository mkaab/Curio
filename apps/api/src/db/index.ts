import Database from 'better-sqlite3';
import { join } from 'path';

// Create or open the SQLite database file in the project root
const dbPath = join(process.cwd(), 'curio.db');
export const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    city TEXT,
    bio TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    brand TEXT,
    condition TEXT NOT NULL,
    size TEXT,
    price INTEGER NOT NULL,
    color TEXT,
    photos TEXT NOT NULL, -- JSON stringified array of image URLs
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES users(id)
  );
`);

console.log(`SQLite database successfully initialized at: ${dbPath}`);
