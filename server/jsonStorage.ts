import {
  type User,
  type UpsertUser,
  type Crossword,
  type InsertCrossword,
  type UserCrosswordHistory,
  type InsertUserCrosswordHistory,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { IStorage } from "./storage";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export class JsonStorage implements IStorage {
  private readonly dataDir = process.cwd();
  private readonly crosswordsFile = join(this.dataDir, "crosswords.json");
  private readonly usersFile = join(this.dataDir, "users.json");
  private readonly historyFile = join(this.dataDir, "history.json");
  private readonly settingsFile = join(this.dataDir, "settings.json");

  private loadJson<T>(file: string, defaultValue: T): T {
    if (!existsSync(file)) {
      writeFileSync(file, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    return JSON.parse(readFileSync(file, "utf-8"));
  }

  private saveJson<T>(file: string, data: T): void {
    writeFileSync(file, JSON.stringify(data, null, 2));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const users = this.loadJson<User[]>(this.usersFile, []);
    return users.find(user => user.id === id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const users = this.loadJson<User[]>(this.usersFile, []);
    const existingIndex = users.findIndex(user => user.id === userData.id);

    const user: User = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    this.saveJson(this.usersFile, users);
    return user;
  }

  // Crossword operations
  async createCrossword(crosswordData: InsertCrossword): Promise<Crossword> {
    const crosswords = this.loadJson<Crossword[]>(this.crosswordsFile, []);
    const crossword: Crossword = {
      id: `crossword_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: crosswordData.title,
      content: crosswordData.content,
      gridSize: crosswordData.gridSize || 7,
      numberRange: crosswordData.numberRange || { min: 1, max: 20 },
      operations: crosswordData.operations || ['+'],
      createdAt: new Date(),
    };

    crosswords.push(crossword);
    this.saveJson(this.crosswordsFile, crosswords);
    return crossword;
  }

  async getCrossword(id: string): Promise<Crossword | undefined> {
    const crosswords = this.loadJson<Crossword[]>(this.crosswordsFile, []);
    return crosswords.find(crossword => crossword.id === id);
  }

  async getRandomCrossword(gridSize?: number): Promise<Crossword | undefined> {
    const crosswords = this.loadJson<Crossword[]>(this.crosswordsFile, []);
    const filtered = gridSize
      ? crosswords.filter(c => c.gridSize === gridSize)
      : crosswords;

    if (filtered.length === 0) return undefined;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  // User crossword history operations
  async createUserCrosswordHistory(historyData: InsertUserCrosswordHistory): Promise<UserCrosswordHistory> {
    const history = this.loadJson<UserCrosswordHistory[]>(this.historyFile, []);
    const record: UserCrosswordHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: historyData.userId,
      crosswordId: historyData.crosswordId,
      timeSpent: historyData.timeSpent,
      score: historyData.score,
      completedAt: new Date(),
    };

    history.push(record);
    this.saveJson(this.historyFile, history);
    return record;
  }

  async getUserCrosswordHistory(userId: string, limit = 10): Promise<UserCrosswordHistory[]> {
    const history = this.loadJson<UserCrosswordHistory[]>(this.historyFile, []);
    return history
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
      .slice(0, limit);
  }

  async getUserStats(userId: string): Promise<{
    puzzlesSolved: number;
    bestScore: number;
    bestTime: number;
    totalPoints: number;
  }> {
    const history = this.loadJson<UserCrosswordHistory[]>(this.historyFile, []);
    const userHistory = history.filter(record => record.userId === userId && record.completedAt);

    return {
      puzzlesSolved: userHistory.length,
      bestScore: userHistory.length > 0 ? Math.max(...userHistory.map(h => h.score || 0)) : 0,
      bestTime: userHistory.length > 0 ? Math.min(...userHistory.map(h => h.timeSpent || Infinity)) : 0,
      totalPoints: userHistory.reduce((sum, h) => sum + (h.score || 0), 0),
    };
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const settings = this.loadJson<UserSettings[]>(this.settingsFile, []);
    return settings.find(setting => setting.userId === userId);
  }

  async upsertUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings> {
    const settings = this.loadJson<UserSettings[]>(this.settingsFile, []);
    const existingIndex = settings.findIndex(setting => setting.userId === userId);

    const userSettings: UserSettings = {
      id: `settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      defaultGridSize: settingsData.defaultGridSize || 7,
      numberRange: settingsData.numberRange || { min: 1, max: 20 },
      operations: settingsData.operations || ['+', '-', '×'],
      createdAt: existingIndex >= 0 ? settings[existingIndex].createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      settings[existingIndex] = userSettings;
    } else {
      settings.push(userSettings);
    }

    this.saveJson(this.settingsFile, settings);
    return userSettings;
  }
}
