import { 
  users, tasks, userTasks, referrals,
  type User, type InsertUser, 
  type Task, type InsertTask,
  type UserTask, type InsertUserTask,
  type Referral, type InsertReferral
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<void>;
  updateUserLevel(userId: number, level: number): Promise<void>;
  updateLastActive(userId: number): Promise<void>;
  updateUserWallet(userId: number, tonWallet: string): Promise<void>;
  generateReferralCode(): string;
  generateWelcomeBonus(): number;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  
  // User task operations
  getUserTasks(userId: number): Promise<(UserTask & { task: Task })[]>;
  getUserTask(userId: number, taskId: number): Promise<UserTask | undefined>;
  createUserTask(userTask: InsertUserTask): Promise<UserTask>;
  updateUserTaskStatus(id: number, status: string): Promise<void>;
  completeUserTask(id: number): Promise<void>;
  
  // Referral operations
  getReferrals(userId: number): Promise<(Referral & { referred: User })[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralStats(userId: number): Promise<{ count: number; totalEarned: number }>;
  
  // Leaderboard
  getLeaderboard(limit?: number): Promise<User[]>;
  getUserRank(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  generateWelcomeBonus(): number {
    // Random welcome bonus between 500-2000 tokens
    return Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
  }

  async updateUserWallet(userId: number, tonWallet: string): Promise<void> {
    await db
      .update(users)
      .set({ tonWallet })
      .where(eq(users.id, userId));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const referralCode = this.generateReferralCode();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, referralCode })
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}`,
        totalEarned: sql`${users.totalEarned} + ${amount}`
      })
      .where(eq(users.id, userId));
  }

  async updateUserLevel(userId: number, level: number): Promise<void> {
    await db
      .update(users)
      .set({ level })
      .where(eq(users.id, userId));
  }

  async updateLastActive(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));
  }

  async getTasks(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.isActive, true))
      .orderBy(asc(tasks.sortOrder), asc(tasks.id));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getUserTasks(userId: number): Promise<(UserTask & { task: Task })[]> {
    const results = await db
      .select({
        // UserTask fields
        id: userTasks.id,
        userId: userTasks.userId,
        taskId: userTasks.taskId,
        status: userTasks.status,
        completedAt: userTasks.completedAt,
        verifiedAt: userTasks.verifiedAt,
        rewardClaimed: userTasks.rewardClaimed,
        // Task fields
        task: {
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          reward: tasks.reward,
          type: tasks.type,
          category: tasks.category,
          icon: tasks.icon,
          actionUrl: tasks.actionUrl,
          verificationData: tasks.verificationData,
          isActive: tasks.isActive,
          sortOrder: tasks.sortOrder,
          createdAt: tasks.createdAt,
        }
      })
      .from(userTasks)
      .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
      .where(eq(userTasks.userId, userId))
      .orderBy(desc(userTasks.id));
    
    return results;
  }

  async getUserTask(userId: number, taskId: number): Promise<UserTask | undefined> {
    const [userTask] = await db
      .select()
      .from(userTasks)
      .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)));
    return userTask || undefined;
  }

  async createUserTask(userTask: InsertUserTask): Promise<UserTask> {
    const [newUserTask] = await db
      .insert(userTasks)
      .values(userTask)
      .returning();
    return newUserTask;
  }

  async updateUserTaskStatus(id: number, status: string): Promise<void> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    } else if (status === "verified") {
      updateData.verifiedAt = new Date();
      updateData.rewardClaimed = true;
    }

    await db
      .update(userTasks)
      .set(updateData)
      .where(eq(userTasks.id, id));
  }

  async completeUserTask(id: number): Promise<void> {
    await this.updateUserTaskStatus(id, "completed");
  }

  async getReferrals(userId: number): Promise<(Referral & { referred: User })[]> {
    const results = await db
      .select({
        // Referral fields
        id: referrals.id,
        referrerId: referrals.referrerId,
        referredId: referrals.referredId,
        rewardEarned: referrals.rewardEarned,
        createdAt: referrals.createdAt,
        // User fields
        referred: {
          id: users.id,
          telegramId: users.telegramId,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
          balance: users.balance,
          level: users.level,
          totalEarned: users.totalEarned,
          referralCode: users.referralCode,
          referredBy: users.referredBy,
          tonWallet: users.tonWallet,
          welcomeBonusReceived: users.welcomeBonusReceived,
          joinedAt: users.joinedAt,
          lastActive: users.lastActive,
        }
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
    
    return results;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db
      .insert(referrals)
      .values(referral)
      .returning();
    return newReferral;
  }

  async getReferralStats(userId: number): Promise<{ count: number; totalEarned: number }> {
    const [stats] = await db
      .select({
        count: sql<number>`count(*)`,
        totalEarned: sql<number>`coalesce(sum(${referrals.rewardEarned}), 0)`
      })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
    
    return {
      count: Number(stats.count),
      totalEarned: Number(stats.totalEarned)
    };
  }

  async getLeaderboard(limit = 100): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalEarned), desc(users.balance))
      .limit(limit);
  }

  async getUserRank(userId: number): Promise<number> {
    const [result] = await db
      .select({ rank: sql<number>`rank() over (order by ${users.totalEarned} desc, ${users.balance} desc)` })
      .from(users)
      .where(eq(users.id, userId));
    
    return Number(result?.rank || 0);
  }
}

export const storage = new DatabaseStorage();
