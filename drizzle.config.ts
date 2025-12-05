import { defineConfig } from "drizzle-kit";

// Select database URL based on environment
const getDatabaseUrl = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // In production, use DATABASE_URL_PROD, in development use DATABASE_URL_DEV
  // Fallback to DATABASE_URL for backward compatibility
  let url: string | undefined;

  if (nodeEnv === 'production') {
    url = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  } else {
    url = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  }

  if (!url) {
    throw new Error("DATABASE_URL not found. Set DATABASE_URL_DEV or DATABASE_URL_PROD in .env file");
  }

  console.log(`Using ${nodeEnv} database for migrations`);
  return url;
};

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
