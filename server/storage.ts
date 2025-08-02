import { type User, type InsertUser, type Puzzle, type InsertPuzzle, type GameStats, type InsertGameStats, type GridCell, type CellType } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPuzzle(id: string): Promise<Puzzle | undefined>;
  getPuzzlesByDifficulty(difficulty: string): Promise<Puzzle[]>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  
  getGameStats(userId: string): Promise<GameStats[]>;
  createGameStats(gameStats: InsertGameStats): Promise<GameStats>;
  updateGameStats(id: string, gameStats: Partial<GameStats>): Promise<GameStats | undefined>;
  
  generatePuzzle(difficulty: 'easy' | 'medium' | 'hard'): Promise<{ grid: GridCell[][], solution: GridCell[][] }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private puzzles: Map<string, Puzzle>;
  private gameStats: Map<string, GameStats>;

  constructor() {
    this.users = new Map();
    this.puzzles = new Map();
    this.gameStats = new Map();
    this.initializeDefaultPuzzles();
  }

  private initializeDefaultPuzzles() {
    // Create a default medium difficulty puzzle
    const defaultPuzzle = this.createDefaultPuzzle();
    const puzzleId = randomUUID();
    const puzzle: Puzzle = {
      id: puzzleId,
      difficulty: 'medium',
      grid: defaultPuzzle.grid,
      solution: defaultPuzzle.solution,
      createdAt: new Date(),
    };
    this.puzzles.set(puzzleId, puzzle);
  }

  private createDefaultPuzzle(): { grid: GridCell[][], solution: GridCell[][] } {
    // Create the puzzle from the image: 8 - ? = ?, etc.
    const grid: GridCell[][] = [
      [
        { type: 'number', value: 8, isEditable: false, row: 0, col: 0 },
        { type: 'operator', value: '-', isEditable: false, row: 0, col: 1 },
        { type: 'input', value: '', isEditable: true, row: 0, col: 2 },
        { type: 'operator', value: '=', isEditable: false, row: 0, col: 3 },
        { type: 'input', value: '', isEditable: true, row: 0, col: 4 },
      ],
      [
        { type: 'operator', value: '+', isEditable: false, row: 1, col: 0 },
        { type: 'blocked', value: '', isEditable: false, row: 1, col: 1 },
        { type: 'operator', value: '+', isEditable: false, row: 1, col: 2 },
        { type: 'blocked', value: '', isEditable: false, row: 1, col: 3 },
        { type: 'operator', value: '+', isEditable: false, row: 1, col: 4 },
      ],
      [
        { type: 'input', value: '', isEditable: true, row: 2, col: 0 },
        { type: 'operator', value: '-', isEditable: false, row: 2, col: 1 },
        { type: 'number', value: 1, isEditable: false, row: 2, col: 2 },
        { type: 'operator', value: '=', isEditable: false, row: 2, col: 3 },
        { type: 'input', value: '', isEditable: true, row: 2, col: 4 },
      ],
      [
        { type: 'operator', value: '=', isEditable: false, row: 3, col: 0 },
        { type: 'blocked', value: '', isEditable: false, row: 3, col: 1 },
        { type: 'operator', value: '=', isEditable: false, row: 3, col: 2 },
        { type: 'blocked', value: '', isEditable: false, row: 3, col: 3 },
        { type: 'operator', value: '=', isEditable: false, row: 3, col: 4 },
      ],
      [
        { type: 'number', value: 10, isEditable: false, row: 4, col: 0 },
        { type: 'operator', value: '-', isEditable: false, row: 4, col: 1 },
        { type: 'input', value: '', isEditable: true, row: 4, col: 2 },
        { type: 'operator', value: '=', isEditable: false, row: 4, col: 3 },
        { type: 'number', value: 5, isEditable: false, row: 4, col: 4 },
      ],
    ];

    const solution: GridCell[][] = [
      [
        { type: 'number', value: 8, isEditable: false, row: 0, col: 0 },
        { type: 'operator', value: '-', isEditable: false, row: 0, col: 1 },
        { type: 'input', value: 4, isEditable: true, row: 0, col: 2 },
        { type: 'operator', value: '=', isEditable: false, row: 0, col: 3 },
        { type: 'input', value: 4, isEditable: true, row: 0, col: 4 },
      ],
      [
        { type: 'operator', value: '+', isEditable: false, row: 1, col: 0 },
        { type: 'blocked', value: '', isEditable: false, row: 1, col: 1 },
        { type: 'operator', value: '+', isEditable: false, row: 1, col: 2 },
        { type: 'blocked', value: '', isEditable: false, row: 1, col: 3 },
        { type: 'operator', value: '+', isEditable: false, row: 1, col: 4 },
      ],
      [
        { type: 'input', value: 2, isEditable: true, row: 2, col: 0 },
        { type: 'operator', value: '-', isEditable: false, row: 2, col: 1 },
        { type: 'number', value: 1, isEditable: false, row: 2, col: 2 },
        { type: 'operator', value: '=', isEditable: false, row: 2, col: 3 },
        { type: 'input', value: 1, isEditable: true, row: 2, col: 4 },
      ],
      [
        { type: 'operator', value: '=', isEditable: false, row: 3, col: 0 },
        { type: 'blocked', value: '', isEditable: false, row: 3, col: 1 },
        { type: 'operator', value: '=', isEditable: false, row: 3, col: 2 },
        { type: 'blocked', value: '', isEditable: false, row: 3, col: 3 },
        { type: 'operator', value: '=', isEditable: false, row: 3, col: 4 },
      ],
      [
        { type: 'number', value: 10, isEditable: false, row: 4, col: 0 },
        { type: 'operator', value: '-', isEditable: false, row: 4, col: 1 },
        { type: 'input', value: 5, isEditable: true, row: 4, col: 2 },
        { type: 'operator', value: '=', isEditable: false, row: 4, col: 3 },
        { type: 'number', value: 5, isEditable: false, row: 4, col: 4 },
      ],
    ];

    return { grid, solution };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPuzzle(id: string): Promise<Puzzle | undefined> {
    return this.puzzles.get(id);
  }

  async getPuzzlesByDifficulty(difficulty: string): Promise<Puzzle[]> {
    return Array.from(this.puzzles.values()).filter(
      (puzzle) => puzzle.difficulty === difficulty
    );
  }

  async createPuzzle(insertPuzzle: InsertPuzzle): Promise<Puzzle> {
    const id = randomUUID();
    const puzzle: Puzzle = { 
      ...insertPuzzle, 
      id,
      createdAt: new Date()
    };
    this.puzzles.set(id, puzzle);
    return puzzle;
  }

  async getGameStats(userId: string): Promise<GameStats[]> {
    return Array.from(this.gameStats.values()).filter(
      (stats) => stats.userId === userId
    );
  }

  async createGameStats(insertGameStats: InsertGameStats): Promise<GameStats> {
    const id = randomUUID();
    const gameStats: GameStats = { 
      ...insertGameStats, 
      id,
      startedAt: new Date()
    };
    this.gameStats.set(id, gameStats);
    return gameStats;
  }

  async updateGameStats(id: string, updates: Partial<GameStats>): Promise<GameStats | undefined> {
    const existing = this.gameStats.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.gameStats.set(id, updated);
    return updated;
  }

  async generatePuzzle(difficulty: 'easy' | 'medium' | 'hard'): Promise<{ grid: GridCell[][], solution: GridCell[][] }> {
    // For now, return the default puzzle regardless of difficulty
    // In a real implementation, this would generate puzzles algorithmically
    return this.createDefaultPuzzle();
  }
}

export const storage = new MemStorage();
