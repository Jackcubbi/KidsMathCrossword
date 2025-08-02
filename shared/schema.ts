import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const puzzles = pgTable("puzzles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  difficulty: text("difficulty").notNull(),
  grid: jsonb("grid").notNull(),
  solution: jsonb("solution").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameStats = pgTable("game_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  puzzleId: varchar("puzzle_id").references(() => puzzles.id),
  completionTime: integer("completion_time"), // in seconds
  hintsUsed: integer("hints_used").default(0),
  isCompleted: boolean("is_completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPuzzleSchema = createInsertSchema(puzzles).pick({
  difficulty: true,
  grid: true,
  solution: true,
});

export const insertGameStatsSchema = createInsertSchema(gameStats).pick({
  userId: true,
  puzzleId: true,
  completionTime: true,
  hintsUsed: true,
  isCompleted: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;
export type GameStats = typeof gameStats.$inferSelect;

// Enhanced Puzzle type with proper grid typing
export interface Puzzle {
  id: string;
  difficulty: string;
  grid: GridCell[][];
  solution: GridCell[][];
  createdAt: Date | null;
}

export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;

// Game types
export type CellType = 'number' | 'operator' | 'input' | 'blocked';
export type OperatorType = '+' | '-' | '=';

export interface GridCell {
  type: CellType;
  value: string | number;
  isEditable: boolean;
  row: number;
  col: number;
}

export interface GameState {
  grid: GridCell[][];
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted: boolean;
  hintsUsed: number;
  startTime: number;
  completionTime?: number;
}
