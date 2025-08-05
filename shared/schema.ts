import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON stored as text in SQLite
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Crosswords table
export const crosswords = sqliteTable("crosswords", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content", { mode: 'json' }).notNull(), // Grid structure and answers
  gridSize: integer("grid_size").notNull().default(7),
  numberRange: text("number_range", { mode: 'json' }).notNull().default('{"min": 1, "max": 20}'),
  operations: text("operations", { mode: 'json' }).notNull().default('["+"]'), // Array of operations
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// User crossword history
export const userCrosswordHistory = sqliteTable("user_crossword_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  crosswordId: text("crossword_id").notNull().references(() => crosswords.id),
  timeSpent: integer("time_spent").notNull(), // in seconds
  score: integer("score").notNull(),
  completedAt: integer("completed_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// User settings
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  defaultGridSize: integer("default_grid_size").notNull().default(7),
  numberRange: text("number_range", { mode: 'json' }).notNull().default('{"min": 1, "max": 20}'),
  operations: text("operations", { mode: 'json' }).notNull().default('["+", "-", "×"]'),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  crosswordHistory: many(userCrosswordHistory),
  settings: one(userSettings),
}));

export const crosswordsRelations = relations(crosswords, ({ many }) => ({
  history: many(userCrosswordHistory),
}));

export const userCrosswordHistoryRelations = relations(userCrosswordHistory, ({ one }) => ({
  user: one(users, {
    fields: [userCrosswordHistory.userId],
    references: [users.id],
  }),
  crossword: one(crosswords, {
    fields: [userCrosswordHistory.crosswordId],
    references: [crosswords.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCrosswordSchema = createInsertSchema(crosswords).omit({
  id: true,
  createdAt: true,
});

export const insertUserCrosswordHistorySchema = createInsertSchema(userCrosswordHistory).omit({
  id: true,
  completedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Crossword = typeof crosswords.$inferSelect;
export type InsertCrossword = z.infer<typeof insertCrosswordSchema>;
export type UserCrosswordHistory = typeof userCrosswordHistory.$inferSelect;
export type InsertUserCrosswordHistory = z.infer<typeof insertUserCrosswordHistorySchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;