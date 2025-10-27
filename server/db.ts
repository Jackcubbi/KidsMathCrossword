import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database features will be disabled.');
  console.warn('To enable database, set DATABASE_URL in your .env file.');
}

// Create connection pool
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Create Drizzle instance with schema
export const db = pool ? drizzle(pool, { schema }) : null;

// Helper to check if database is available
export const isDatabaseAvailable = (): boolean => {
  return db !== null;
};

// Export pool for direct access if needed
export { pool };
