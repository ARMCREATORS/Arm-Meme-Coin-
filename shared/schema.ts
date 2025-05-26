import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  balance: integer("balance").notNull().default(0),
  level: integer("level").notNull().default(1),
  totalEarned: integer("total_earned").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  lastActive: timestamp("last_active").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reward: integer("reward").notNull(),
  type: text("type").notNull(), // 'social', 'referral', 'daily', 'custom'
  category: text("category").notNull(), // 'twitter', 'youtube', 'telegram', 'daily'
  icon: text("icon").notNull(),
  actionUrl: text("action_url"),
  verificationData: jsonb("verification_data"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskId: integer("task_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'verified'
  completedAt: timestamp("completed_at"),
  verifiedAt: timestamp("verified_at"),
  rewardClaimed: boolean("reward_claimed").notNull().default(false),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredId: integer("referred_id").notNull(),
  rewardEarned: integer("reward_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  userTasks: many(userTasks),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "referral_tree"
  }),
  referees: many(users, { relationName: "referral_tree" }),
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  userTasks: many(userTasks),
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, {
    fields: [userTasks.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userTasks.taskId],
    references: [tasks.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer"
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred"
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  referredBy: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  reward: true,
  type: true,
  category: true,
  icon: true,
  actionUrl: true,
  verificationData: true,
  isActive: true,
  sortOrder: true,
});

export const insertUserTaskSchema = createInsertSchema(userTasks).pick({
  userId: true,
  taskId: true,
  status: true,
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
  rewardEarned: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UserTask = typeof userTasks.$inferSelect;
export type InsertUserTask = z.infer<typeof insertUserTaskSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
