import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./appAuth";
import { insertCrosswordSchema, insertUserCrosswordHistorySchema, insertUserSettingsSchema } from "@shared/schema";
import { generateCrossword } from "../client/src/lib/crosswordGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      // In development mode, create the user if it doesn't exist
      if (!user && process.env.NODE_ENV === 'development') {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: null,
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User stats endpoint
  app.get('/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Crossword generation endpoint
  app.post('/crosswords/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gridSize = 7, numberRange = { min: 1, max: 20 }, operations = ['+', '-', '×'] } = req.body;

      // Get user settings if no parameters provided
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        settings = await storage.upsertUserSettings(userId, {
          defaultGridSize: gridSize,
          numberRange,
          operations,
        });
      }

      const finalGridSize = gridSize || settings.defaultGridSize;
      const finalNumberRange = numberRange || settings.numberRange;
      const finalOperations = operations || settings.operations;

      // Generate crossword content
      const crosswordContent = generateCrossword(finalGridSize, finalNumberRange, finalOperations);

      const crossword = await storage.createCrossword({
        title: `Math Crossword ${finalGridSize}x${finalGridSize}`,
        content: crosswordContent,
        gridSize: finalGridSize,
        numberRange: finalNumberRange,
        operations: finalOperations,
      });

      res.json(crossword);
    } catch (error) {
      console.error("Error generating crossword:", error);
      res.status(500).json({ message: "Failed to generate crossword" });
    }
  });

  // Get random crossword
  app.get('/crosswords/random', isAuthenticated, async (req: any, res) => {
    try {
      const { gridSize } = req.query;
      const crossword = await storage.getRandomCrossword(gridSize ? parseInt(gridSize as string) : undefined);

      if (!crossword) {
        // Generate a new one if none exists
        const userId = req.user.claims.sub;
        const settings = await storage.getUserSettings(userId);
        const finalGridSize = gridSize ? parseInt(gridSize as string) : (settings?.defaultGridSize || 7);
        const finalNumberRange = (typeof settings?.numberRange === 'object' && settings?.numberRange)
          ? settings.numberRange as { min: number; max: number }
          : { min: 1, max: 20 };
        const finalOperations = (Array.isArray(settings?.operations) ? settings.operations : ['+', '-', '×']) as string[];

        const crosswordContent = generateCrossword(finalGridSize, finalNumberRange, finalOperations);
        const newCrossword = await storage.createCrossword({
          title: `Math Crossword ${finalGridSize}x${finalGridSize}`,
          content: crosswordContent,
          gridSize: finalGridSize,
          numberRange: finalNumberRange,
          operations: finalOperations,
        });

        res.json(newCrossword);
      } else {
        res.json(crossword);
      }
    } catch (error) {
      console.error("Error fetching random crossword:", error);
      res.status(500).json({ message: "Failed to fetch crossword" });
    }
  });

  // Submit crossword completion
  app.post('/crosswords/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const crosswordId = req.params.id;
      const { timeSpent, score } = req.body;

      const validatedData = insertUserCrosswordHistorySchema.parse({
        userId,
        crosswordId,
        timeSpent,
        score,
      });

      const history = await storage.createUserCrosswordHistory(validatedData);
      res.json(history);
    } catch (error) {
      console.error("Error saving crossword completion:", error);
      res.status(500).json({ message: "Failed to save completion" });
    }
  });

  // Get user crossword history
  app.get('/user/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit } = req.query;
      const history = await storage.getUserCrosswordHistory(userId, limit ? parseInt(limit as string) : undefined);
      res.json(history);
    } catch (error) {
      console.error("Error fetching user history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Get user settings
  app.get('/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let settings = await storage.getUserSettings(userId);

      if (!settings) {
        settings = await storage.upsertUserSettings(userId, {
          defaultGridSize: 7,
          numberRange: { min: 1, max: 20 },
          operations: ['+', '-', '×'],
        });
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update user settings
  app.patch('/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserSettingsSchema.partial().parse(req.body);

      const settings = await storage.upsertUserSettings(userId, validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
