import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCrosswordSchema, insertUserCrosswordHistorySchema, insertUserSettingsSchema } from "@shared/schema";
import { generateCrossword } from "../client/src/lib/crosswordGenerator";
import { z } from "zod";

// Input validation schemas
const crosswordGenerateSchema = z.object({
  gridSize: z.number().int().min(5).max(15).optional(),
  numberRange: z.object({
    min: z.number().int().min(1),
    max: z.number().int().max(100)
  }).optional(),
  operations: z.array(z.enum(["+", "-", "×", "÷"])).optional()
});

const crosswordCompleteSchema = z.object({
  timeSpent: z.number().int().min(0).max(86400), // Max 24 hours
  score: z.number().int().min(0).max(1000)
});

const historyQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).optional()
});

// Mock user for public access
const MOCK_USER_ID = 'public-user';

export async function registerRoutes(app: Express): Promise<Server> {
  // No authentication required - public access

  // Create default public user on startup
  const createDefaultUser = async () => {
    try {
      let user = await storage.getUser(MOCK_USER_ID);
      if (!user) {
        user = await storage.upsertUser({
          id: MOCK_USER_ID,
          email: 'public@example.com',
          firstName: 'Public',
          lastName: 'User',
          profileImageUrl: null,
        });
      }
      return user;
    } catch (error) {
      console.error("Error creating default user:", error);
      return null;
    }
  };

  // Initialize default user
  await createDefaultUser();

  // Mock user endpoint for compatibility
  app.get('/auth/user', async (req: any, res) => {
    try {
      const user = await storage.getUser(MOCK_USER_ID);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User stats endpoint
  app.get('/user/stats', async (req: any, res) => {
    try {
      const userId = MOCK_USER_ID;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Crossword generation endpoint
  app.post('/crosswords/generate', async (req: any, res) => {
    try {
      const userId = MOCK_USER_ID;

      // Validate input
      const validatedInput = crosswordGenerateSchema.parse(req.body);
      const { gridSize = 7, numberRange = { min: 1, max: 20 }, operations = ['+', '-', '×'] } = validatedInput;

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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate crossword" });
    }
  });

  // Get random crossword
  app.get('/crosswords/random', async (req: any, res) => {
    try {
      const { gridSize } = req.query;

      // Validate gridSize if provided
      let validatedGridSize: number | undefined;
      if (gridSize) {
        const gridSizeNum = parseInt(gridSize as string);
        if (isNaN(gridSizeNum) || gridSizeNum < 5 || gridSizeNum > 15) {
          return res.status(400).json({ message: "Grid size must be between 5 and 15" });
        }
        validatedGridSize = gridSizeNum;
      }

      const crossword = await storage.getRandomCrossword(validatedGridSize);

      if (!crossword) {
        // Generate a new one if none exists
        const userId = MOCK_USER_ID;
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
  app.post('/crosswords/:id/complete', async (req: any, res) => {
    try {
      const userId = MOCK_USER_ID;
      const crosswordId = req.params.id;

      // Validate crossword ID format
      if (!crosswordId || typeof crosswordId !== 'string' || crosswordId.length === 0) {
        return res.status(400).json({ message: "Invalid crossword ID" });
      }

      // Validate input data
      const validatedData = crosswordCompleteSchema.parse(req.body);
      const { timeSpent, score } = validatedData;

      const historyData = insertUserCrosswordHistorySchema.parse({
        userId,
        crosswordId,
        timeSpent,
        score,
      });

      const history = await storage.createUserCrosswordHistory(historyData);
      res.json(history);
    } catch (error) {
      console.error("Error saving crossword completion:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save completion" });
    }
  });

  // Get user crossword history
  app.get('/user/history', async (req: any, res) => {
    try {
      const userId = MOCK_USER_ID;

      // Validate query parameters
      const validatedQuery = historyQuerySchema.parse(req.query);
      const history = await storage.getUserCrosswordHistory(userId, validatedQuery.limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching user history:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Get user settings
  app.get('/user/settings', async (req: any, res) => {
    try {
      const userId = MOCK_USER_ID;
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
  app.patch('/user/settings', async (req: any, res) => {
    try {
      const userId = MOCK_USER_ID;

      // Validate that request body is not empty
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
      }

      const validatedData = insertUserSettingsSchema.partial().parse(req.body);

      const settings = await storage.upsertUserSettings(userId, validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
