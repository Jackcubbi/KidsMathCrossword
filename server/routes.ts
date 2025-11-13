import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPuzzleSchema, insertGameStatsSchema } from "@shared/schema";
import { z } from "zod";
import { isDatabaseAvailable } from "./db";
import type { IStorage } from "./storage";

export async function registerRoutes(app: Express): Promise<{ server: Server; storage: IStorage }> {

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    const dbStatus = isDatabaseAvailable() ? "connected" : "memory-only";
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0"
    });
  });

  // Get puzzle by difficulty
  app.get("/api/puzzles/:difficulty", async (req, res) => {
    try {
      const { difficulty } = req.params;
      const puzzles = await storage.getPuzzlesByDifficulty(difficulty);

      if (puzzles.length === 0) {
        // Generate a new puzzle if none exist
        const generated = await storage.generatePuzzle(difficulty as any);
        const newPuzzle = await storage.createPuzzle({
          difficulty,
          grid: generated.grid,
          solution: generated.solution,
        });
        res.json(newPuzzle);
      } else {
        // Return a random puzzle from the available ones
        const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        res.json(randomPuzzle);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get puzzle" });
    }
  });

  // Create a new puzzle
  app.post("/api/puzzles", async (req, res) => {
    try {
      const puzzleData = insertPuzzleSchema.parse(req.body);
      const puzzle = await storage.createPuzzle(puzzleData);
      res.json(puzzle);
    } catch (error) {
      res.status(400).json({ message: "Invalid puzzle data" });
    }
  });

  // Get game statistics
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getGameStats(userId);

      // Calculate aggregated statistics
      const completedGames = stats.filter(s => s.isCompleted);
      const totalSolved = completedGames.length;
      const completionTimes = completedGames
        .map(s => s.completionTime)
        .filter(t => t !== null) as number[];

      const bestTime = completionTimes.length > 0 ? Math.min(...completionTimes) : 0;
      const averageTime = completionTimes.length > 0 ?
        Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
      const totalHints = stats.reduce((sum, s) => sum + (s.hintsUsed || 0), 0);

      res.json({
        totalSolved,
        bestTime,
        averageTime,
        totalHints,
        recentGames: stats.slice(-10)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });

  // Create game session
  app.post("/api/game-sessions", async (req, res) => {
    try {
      const gameData = insertGameStatsSchema.parse(req.body);
      const gameStats = await storage.createGameStats(gameData);
      res.json(gameStats);
    } catch (error) {
      res.status(400).json({ message: "Invalid game session data" });
    }
  });

  // Update game session
  app.patch("/api/game-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.isCompleted) {
        updates.completedAt = new Date();
      }

      const gameStats = await storage.updateGameStats(id, updates);
      if (!gameStats) {
        return res.status(404).json({ message: "Game session not found" });
      }

      res.json(gameStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to update game session" });
    }
  });

  // Validate solution
  app.post("/api/validate-solution", async (req, res) => {
    try {
      const { grid } = req.body;

      // Validate horizontal equations
      const horizontalValid = validateHorizontalEquations(grid);

      // Validate vertical equations
      const verticalValid = validateVerticalEquations(grid);

      const isValid = horizontalValid.every(eq => eq.isValid) &&
                     verticalValid.every(eq => eq.isValid);

      res.json({
        isValid,
        horizontalEquations: horizontalValid,
        verticalEquations: verticalValid
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate solution" });
    }
  });

  const httpServer = createServer(app);
  return { server: httpServer, storage };
}

function validateHorizontalEquations(grid: any[][]) {
  const equations = [];

  // Check rows 0, 2, 4 (equation rows)
  for (const row of [0, 2, 4]) {
    const cells = grid[row];
    if (cells.length >= 5) {
      const num1 = parseFloat(cells[0].value) || 0;
      const operator = cells[1].value;
      const num2 = parseFloat(cells[2].value) || 0;
      const result = parseFloat(cells[4].value) || 0;

      let expected = 0;
      if (operator === '+') {
        expected = num1 + num2;
      } else if (operator === '-') {
        expected = num1 - num2;
      }

      equations.push({
        row,
        equation: `${num1} ${operator} ${num2} = ${result}`,
        isValid: expected === result && !isNaN(expected) && !isNaN(result)
      });
    }
  }

  return equations;
}

function validateVerticalEquations(grid: any[][]) {
  const equations = [];

  // Check columns 0, 2, 4 (equation columns)
  for (const col of [0, 2, 4]) {
    if (grid.length >= 5) {
      const num1 = parseFloat(grid[0][col].value) || 0;
      const operator = grid[1][col].value;
      const num2 = parseFloat(grid[2][col].value) || 0;
      const result = parseFloat(grid[4][col].value) || 0;

      let expected = 0;
      if (operator === '+') {
        expected = num1 + num2;
      } else if (operator === '-') {
        expected = num1 - num2;
      }

      equations.push({
        col,
        equation: `${num1} ${operator} ${num2} = ${result}`,
        isValid: expected === result && !isNaN(expected) && !isNaN(result)
      });
    }
  }

  return equations;
}
