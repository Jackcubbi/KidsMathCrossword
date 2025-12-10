import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { initializeDatabase } from "./init-db";
import { isDatabaseAvailable } from "./db";
import { setupAuth } from "./auth";
import { registerAuthRoutes } from "./authRoutes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Simple logging function for production
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database if available
  if (isDatabaseAvailable()) {
    log('Database connection available', 'database');
    try {
      await initializeDatabase();
      log('Database initialized successfully', 'database');
    } catch (error) {
      log(`Database initialization failed: ${error}`, 'database');
    }
  } else {
    log('Running in memory-only mode (no database connection)', 'database');
  }

  const { server, storage } = await registerRoutes(app);

  // Setup authentication
  setupAuth(app, storage);
  registerAuthRoutes(app, storage);
  log('Authentication system initialized', 'auth');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    // Use dynamic import with template to avoid bundling vite in production
    const viteModule = "./vite.js";
    const { setupVite } = await import(/* @vite-ignore */ viteModule);
    await setupVite(app, server);
  } else {
    // Production static file serving
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const fs = await import("fs");

    // Get the directory name in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // In production, static files are in dist/public
    const distPath = path.resolve(__dirname, "public");

    if (!fs.existsSync(distPath)) {
      log(`Build directory not found at: ${distPath}`, 'static');
      log('Please run "npm run build" first', 'static');
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }

    log(`Serving static files from: ${distPath}`, 'static');
    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0';

  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
