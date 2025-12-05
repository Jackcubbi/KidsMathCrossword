import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// Select database URL based on environment
const getDatabaseUrl = (): string | undefined => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // In production, use DATABASE_URL_PROD, in development use DATABASE_URL_DEV
  // Fallback to DATABASE_URL for backward compatibility
  if (nodeEnv === 'production') {
    return process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  }

  return process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
};

const databaseUrl = getDatabaseUrl();

// Validate DATABASE_URL
if (!databaseUrl) {
  console.warn('DATABASE_URL is not set. Database features will be disabled.');
  console.warn('To enable database, set DATABASE_URL_DEV or DATABASE_URL_PROD in your .env file.');
}

// Create connection pool
const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

// Log which database is being used (without exposing credentials)
if (pool && databaseUrl) {
  const env = process.env.NODE_ENV || 'development';
  const dbInfo = databaseUrl.match(/@(.+?)\/(.+?)\?/);
  if (dbInfo) {
    console.log(`Connected to ${env} database: ${dbInfo[2]} @ ${dbInfo[1].split('-pooler')[0]}`);
  }
}

// Create Drizzle instance with schema
export const db = pool ? drizzle(pool, { schema }) : null;

// Helper to check if database is available
export const isDatabaseAvailable = (): boolean => {
  return db !== null;
};

// Export pool for direct access if needed
export { pool };
