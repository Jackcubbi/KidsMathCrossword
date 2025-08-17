import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectSqlite3 from "connect-sqlite3";
import { storage } from "./storage";

// Always use development mode authentication - simplified for this project
const isDevelopment = true;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Keep false for local development/production
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  console.log("Using simplified authentication setup");

  // Use simple session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Simple login route that establishes a session
  app.post("/login", (req, res) => {
    if (req.session) {
      (req.session as any).loggedOut = false;
      (req.session as any).authenticated = true;
    }
    res.json({ message: "Logged in successfully" });
  });

  // Logout route
  app.get("/logout", (req, res) => {
    // Mark session as logged out before destroying
    if (req.session) {
      (req.session as any).loggedOut = true;
    }
    req.session?.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      // Redirect to landing page after logout
      res.redirect("/");
    });
  });

  // Callback route (for compatibility)
  app.get("/callback", (req, res) => {
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Always use simple session-based authentication
  // Check if user has a valid session and is authenticated
  if (!req.session || (req.session as any).loggedOut || !(req.session as any).authenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Create a mock user if session is valid
  (req as any).user = {
    claims: {
      sub: 'dev-user-123',
      email: 'dev@example.com',
      first_name: 'Dev',
      last_name: 'User'
    }
  };
  return next();
};