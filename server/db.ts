import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { join } from 'path';

// Create SQLite database file in the project root
const dbPath = join(process.cwd(), 'database.sqlite');
console.log(`Using SQLite database at: ${dbPath}`);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

console.log("SQLite database initialized successfully");