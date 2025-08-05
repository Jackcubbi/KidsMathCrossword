import {
  users,
  crosswords,
  userCrosswordHistory,
  userSettings,
  type User,
  type UpsertUser,
  type Crossword,
  type InsertCrossword,
  type UserCrosswordHistory,
  type InsertUserCrosswordHistory,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Crossword operations
  createCrossword(crossword: InsertCrossword): Promise<Crossword>;
  getCrossword(id: string): Promise<Crossword | undefined>;
  getRandomCrossword(gridSize?: number): Promise<Crossword | undefined>;

  // User crossword history operations
  createUserCrosswordHistory(history: InsertUserCrosswordHistory): Promise<UserCrosswordHistory>;
  getUserCrosswordHistory(userId: string, limit?: number): Promise<UserCrosswordHistory[]>;
  getUserStats(userId: string): Promise<{
    puzzlesSolved: number;
    bestScore: number;
    bestTime: number;
    totalPoints: number;
  }>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Crossword operations
  async createCrossword(crossword: InsertCrossword): Promise<Crossword> {
    const [newCrossword] = await db
      .insert(crosswords)
      .values(crossword)
      .returning();
    return newCrossword;
  }

  async getCrossword(id: string): Promise<Crossword | undefined> {
    const [crossword] = await db
      .select()
      .from(crosswords)
      .where(eq(crosswords.id, id));
    return crossword;
  }

  async getRandomCrossword(gridSize?: number): Promise<Crossword | undefined> {
    let query = db.select().from(crosswords);

    if (gridSize) {
      query = query.where(eq(crosswords.gridSize, gridSize));
    }

    const crosswordList = await query;
    if (crosswordList.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * crosswordList.length);
    return crosswordList[randomIndex];
  }

  // User crossword history operations
  async createUserCrosswordHistory(history: InsertUserCrosswordHistory): Promise<UserCrosswordHistory> {
    const [newHistory] = await db
      .insert(userCrosswordHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getUserCrosswordHistory(userId: string, limit = 50): Promise<UserCrosswordHistory[]> {
    return await db
      .select()
      .from(userCrosswordHistory)
      .where(eq(userCrosswordHistory.userId, userId))
      .orderBy(desc(userCrosswordHistory.completedAt))
      .limit(limit);
  }

  async getUserStats(userId: string): Promise<{
    puzzlesSolved: number;
    bestScore: number;
    bestTime: number;
    totalPoints: number;
  }> {
    const histories = await db
      .select()
      .from(userCrosswordHistory)
      .where(eq(userCrosswordHistory.userId, userId));

    const puzzlesSolved = histories.length;
    const bestScore = histories.length > 0 ? Math.max(...histories.map(h => h.score)) : 0;
    const bestTime = histories.length > 0 ? Math.min(...histories.map(h => h.timeSpent)) : 0;
    const totalPoints = histories.reduce((sum, h) => sum + h.score, 0);

    return {
      puzzlesSolved,
      bestScore,
      bestTime,
      totalPoints,
    };
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values({ userId, ...settingsData })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }
}

// Use SQLite database storage
export const storage = new DatabaseStorage();
