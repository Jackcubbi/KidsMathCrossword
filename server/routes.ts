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

      // Always generate a fresh puzzle with random given numbers pattern
      const generated = await storage.generatePuzzle(difficulty as any);
      const newPuzzle = await storage.createPuzzle({
        difficulty,
        grid: generated.grid,
        solution: generated.solution,
      });
      res.json(newPuzzle);
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

      // Log validation results for debugging
      console.log('Validation Results:');
      console.log('Horizontal:', horizontalValid);
      console.log('Vertical:', verticalValid);
      console.log('All Valid:', isValid);

      res.json({
        isValid,
        horizontalEquations: horizontalValid,
        verticalEquations: verticalValid
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ message: "Failed to validate solution" });
    }
  });

  const httpServer = createServer(app);
  return { server: httpServer, storage };
}

function validateHorizontalEquations(grid: any[][]) {
  const equations = [];
  const gridSize = grid.length;

  // Helper function to evaluate with order of operations
  const evaluateEquation = (values: number[], operators: string[]): number => {
    let nums = [...values];
    let ops = [...operators];

    // First pass: handle * and /
    for (let i = 0; i < ops.length; i++) {
      if (ops[i] === '*' || ops[i] === '/') {
        const result = ops[i] === '*' ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1];
        nums.splice(i, 2, result);
        ops.splice(i, 1);
        i--;
      }
    }

    // Second pass: handle + and -
    let result = nums[0];
    for (let i = 0; i < ops.length; i++) {
      result = ops[i] === '+' ? result + nums[i + 1] : result - nums[i + 1];
    }
    return result;
  };

  // Check all equation rows (0, 2, 4, 6, 8... all even rows)
  for (let row = 0; row < gridSize; row += 2) {
    const cells = grid[row];
    if (!cells || cells.length === 0) continue;

    // Check if this is a 9x9 grid with dual equations
    const isDualEquation = gridSize === 9;

    if (isDualEquation) {
      // For 9x9: TWO mini-equations per row
      // Structure: v0 op v1 = r1 op v2 = r2
      // Cols:      0  1  2  3  4  5  6  7  8

      const v0 = parseFloat(cells[0]?.value) || 0;
      const op1 = cells[1]?.value || '+';
      const v1 = parseFloat(cells[2]?.value) || 0;
      const r1 = parseFloat(cells[4]?.value) || 0;
      const op2 = cells[5]?.value || '+';
      const v2 = parseFloat(cells[6]?.value) || 0;
      const r2 = parseFloat(cells[8]?.value) || 0;

      // Validate first mini-equation: v0 op1 v1 = r1
      const expected1 = evaluateEquation([v0, v1], [op1]);
      const isValid1 = Math.abs(expected1 - r1) < 0.001 && !isNaN(expected1) && !isNaN(r1);

      // Validate second mini-equation: r1 op2 v2 = r2
      const expected2 = evaluateEquation([r1, v2], [op2]);
      const isValid2 = Math.abs(expected2 - r2) < 0.001 && !isNaN(expected2) && !isNaN(r2);

      const equation = `${v0} ${op1} ${v1} = ${r1}, ${r1} ${op2} ${v2} = ${r2}`;

      equations.push({
        row,
        equation,
        isValid: isValid1 && isValid2
      });
    } else {
      // For 5x5/7x7: ONE equation per row with order of operations
      // Collect all values and operators from the row
      const values: number[] = [];
      const operators: string[] = [];

      for (let col = 0; col < cells.length; col++) {
        const cell = cells[col];
        if (!cell) continue;

        if (cell.type === 'number' || cell.type === 'input') {
          values.push(parseFloat(cell.value) || 0);
        } else if (cell.type === 'operator' && cell.value !== '=') {
          operators.push(cell.value);
        }
      }

      // Need at least 2 values and 1 operator to make an equation
      if (values.length < 2 || operators.length < 1) continue;

      // The last value is the result
      const result = values[values.length - 1];
      const equationValues = values.slice(0, -1);

      // Calculate expected result with proper order of operations
      const expected = evaluateEquation(equationValues, operators);

      // Build equation string
      let equation = equationValues[0].toString();
      for (let i = 0; i < operators.length && i < equationValues.length - 1; i++) {
        equation += ` ${operators[i]} ${equationValues[i + 1]}`;
      }
      equation += ` = ${result}`;

      equations.push({
        row,
        equation,
        isValid: Math.abs(expected - result) < 0.001 && !isNaN(expected) && !isNaN(result)
      });
    }
  }

  return equations;
}

function validateVerticalEquations(grid: any[][]) {
  const equations = [];
  const gridSize = grid.length;
  const colSize = grid[0]?.length || 0;

  // Helper function to evaluate with order of operations
  const evaluateEquation = (values: number[], operators: string[]): number => {
    let nums = [...values];
    let ops = [...operators];

    // First pass: handle * and /
    for (let i = 0; i < ops.length; i++) {
      if (ops[i] === '*' || ops[i] === '/') {
        const result = ops[i] === '*' ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1];
        nums.splice(i, 2, result);
        ops.splice(i, 1);
        i--;
      }
    }

    // Second pass: handle + and -
    let result = nums[0];
    for (let i = 0; i < ops.length; i++) {
      result = ops[i] === '+' ? result + nums[i + 1] : result - nums[i + 1];
    }
    return result;
  };

  // Check all equation columns (0, 2, 4, 6, 8... all even columns)
  for (let col = 0; col < colSize; col += 2) {
    // Check if this is a 9x9 grid with dual equations
    const isDualEquation = gridSize === 9;

    if (isDualEquation) {
      // For 9x9: TWO mini-equations vertically
      // Extract values at rows 0,2,4,6,8 (5 values)
      // Extract operators at rows 1,5 (2 operators)
      // Structure: v0 op1 v1 = r1 op2 v2 = r2

      const v0 = parseFloat(grid[0]?.[col]?.value) || 0;
      const v1 = parseFloat(grid[2]?.[col]?.value) || 0;
      const r1 = parseFloat(grid[4]?.[col]?.value) || 0;
      const v2 = parseFloat(grid[6]?.[col]?.value) || 0;
      const r2 = parseFloat(grid[8]?.[col]?.value) || 0;

      const op1 = grid[1]?.[col]?.value || '+';
      const op2 = grid[5]?.[col]?.value || '+';

      // Validate first mini-equation: v0 op1 v1 = r1
      const expected1 = evaluateEquation([v0, v1], [op1]);
      const isValid1 = Math.abs(expected1 - r1) < 0.001 && !isNaN(expected1) && !isNaN(r1);

      // Validate second mini-equation: r1 op2 v2 = r2
      const expected2 = evaluateEquation([r1, v2], [op2]);
      const isValid2 = Math.abs(expected2 - r2) < 0.001 && !isNaN(expected2) && !isNaN(r2);

      const equation = `${v0} ${op1} ${v1} = ${r1}, ${r1} ${op2} ${v2} = ${r2}`;

      equations.push({
        col,
        equation,
        isValid: isValid1 && isValid2
      });
    } else {
      // For 5x5/7x7: ONE equation per column with order of operations
      // Collect all values and operators from the column
      // Only iterate through even rows (0, 2, 4, 6...) for equation rows
      const values: number[] = [];
      const operators: string[] = [];

      for (let row = 0; row < gridSize; row += 2) {
        const cell = grid[row]?.[col];
        if (!cell) continue;

        if (cell.type === 'number' || cell.type === 'input') {
          values.push(parseFloat(cell.value) || 0);
        }

        // Get operator from the next row (odd row) if it exists
        if (row + 1 < gridSize) {
          const opCell = grid[row + 1]?.[col];
          if (opCell && opCell.type === 'operator' && opCell.value !== '=') {
            operators.push(opCell.value);
          }
        }
      }

      // Need at least 2 values and 1 operator to make an equation
      if (values.length < 2 || operators.length < 1) continue;

      // The last value is the result
      const result = values[values.length - 1];
      const equationValues = values.slice(0, -1);

      // Calculate expected result with proper order of operations
      const expected = evaluateEquation(equationValues, operators);

      // Build equation string
      let equation = equationValues[0].toString();
      for (let i = 0; i < operators.length && i < equationValues.length - 1; i++) {
        equation += ` ${operators[i]} ${equationValues[i + 1]}`;
      }
      equation += ` = ${result}`;

      equations.push({
        col,
        equation,
        isValid: Math.abs(expected - result) < 0.001 && !isNaN(expected) && !isNaN(result)
      });
    }
  }

  return equations;
}
