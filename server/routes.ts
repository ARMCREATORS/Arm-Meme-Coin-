import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertUserTaskSchema } from "@shared/schema";
import { z } from "zod";

const telegramAuthSchema = z.object({
  telegramId: z.string(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().optional(),
  referralCode: z.string().optional(),
});

const startTaskSchema = z.object({
  taskId: z.number(),
});

const completeTaskSchema = z.object({
  userTaskId: z.number(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoint
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const data = telegramAuthSchema.parse(req.body);
      
      // Check if user exists
      let user = await storage.getUserByTelegramId(data.telegramId);
      
      if (!user) {
        // Handle referral
        let referredBy: number | undefined;
        if (data.referralCode) {
          const referrer = await storage.getUserByTelegramId(data.referralCode);
          if (referrer) {
            referredBy = referrer.id;
          }
        }
        
        // Create new user
        user = await storage.createUser({
          telegramId: data.telegramId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.avatarUrl,
          referredBy,
        });
        
        // Create referral record if applicable
        if (referredBy) {
          const referralReward = 40; // 40 tokens for successful referral
          await storage.createReferral({
            referrerId: referredBy,
            referredId: user.id,
            rewardEarned: referralReward,
          });
          
          // Reward the referrer
          await storage.updateUserBalance(referredBy, referralReward);
        }
      } else {
        // Update last active
        await storage.updateLastActive(user.id);
      }
      
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid authentication data" });
    }
  });

  // Get current user profile
  app.get("/api/user/:telegramId", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const rank = await storage.getUserRank(user.id);
      const referralStats = await storage.getReferralStats(user.id);
      
      res.json({ 
        user: { ...user, rank },
        referralStats 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Get available tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json({ tasks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get user's task progress
  app.get("/api/user/:telegramId/tasks", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userTasks = await storage.getUserTasks(user.id);
      res.json({ userTasks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user tasks" });
    }
  });

  // Start a task
  app.post("/api/tasks/start", async (req, res) => {
    try {
      const { taskId } = startTaskSchema.parse(req.body);
      const telegramId = req.body.telegramId;
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Check if user already has this task
      const existingUserTask = await storage.getUserTask(user.id, taskId);
      if (existingUserTask) {
        return res.status(400).json({ error: "Task already started" });
      }
      
      // Create user task
      const userTask = await storage.createUserTask({
        userId: user.id,
        taskId: taskId,
        status: "pending",
      });
      
      res.json({ userTask, actionUrl: task.actionUrl });
    } catch (error) {
      res.status(400).json({ error: "Failed to start task" });
    }
  });

  // Complete a task (verify and reward)
  app.post("/api/tasks/complete", async (req, res) => {
    try {
      const { userTaskId } = completeTaskSchema.parse(req.body);
      const telegramId = req.body.telegramId;
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user task details
      const userTasks = await storage.getUserTasks(user.id);
      const userTask = userTasks.find(ut => ut.id === userTaskId);
      
      if (!userTask) {
        return res.status(404).json({ error: "User task not found" });
      }
      
      if (userTask.status === "verified") {
        return res.status(400).json({ error: "Task already completed" });
      }
      
      // Mark as verified and reward user
      await storage.updateUserTaskStatus(userTaskId, "verified");
      await storage.updateUserBalance(user.id, userTask.task.reward);
      
      // Update user level based on total earned (simple level calculation)
      const updatedUser = await storage.getUser(user.id);
      if (updatedUser) {
        const newLevel = Math.floor(updatedUser.totalEarned / 1000) + 1;
        if (newLevel > updatedUser.level) {
          await storage.updateUserLevel(user.id, newLevel);
        }
      }
      
      res.json({ 
        success: true, 
        reward: userTask.task.reward,
        message: "Task completed successfully!" 
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to complete task" });
    }
  });

  // Get referrals
  app.get("/api/user/:telegramId/referrals", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const referrals = await storage.getReferrals(user.id);
      const referralStats = await storage.getReferralStats(user.id);
      
      res.json({ 
        referrals, 
        stats: referralStats,
        referralLink: `https://t.me/cryptoairdropbot?start=${user.referralCode}`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json({ leaderboard });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Initialize default tasks (admin endpoint)
  app.post("/api/admin/init-tasks", async (req, res) => {
    try {
      const defaultTasks = [
        {
          title: "Follow @CryptoProject",
          description: "Follow our Twitter account",
          reward: 50,
          type: "social",
          category: "twitter",
          icon: "fab fa-twitter",
          actionUrl: "https://twitter.com/cryptoproject",
          verificationData: {},
          isActive: true,
          sortOrder: 1,
        },
        {
          title: "Subscribe YouTube",
          description: "Subscribe to our channel",
          reward: 75,
          type: "social",
          category: "youtube",
          icon: "fab fa-youtube",
          actionUrl: "https://youtube.com/@cryptoproject",
          verificationData: {},
          isActive: true,
          sortOrder: 2,
        },
        {
          title: "Join Telegram Channel",
          description: "Join our official Telegram channel",
          reward: 100,
          type: "social",
          category: "telegram",
          icon: "fab fa-telegram",
          actionUrl: "https://t.me/cryptoproject",
          verificationData: {},
          isActive: true,
          sortOrder: 3,
        },
        {
          title: "Daily Check-in",
          description: "Visit daily for bonus",
          reward: 25,
          type: "daily",
          category: "daily",
          icon: "fas fa-calendar-check",
          actionUrl: "",
          verificationData: {},
          isActive: true,
          sortOrder: 4,
        },
        {
          title: "Refer 3 Friends",
          description: "Invite friends to join",
          reward: 200,
          type: "referral",
          category: "referral",
          icon: "fas fa-user-plus",
          actionUrl: "",
          verificationData: { requiredReferrals: 3 },
          isActive: true,
          sortOrder: 5,
        },
      ];

      for (const task of defaultTasks) {
        await storage.createTask(task);
      }

      res.json({ success: true, message: "Default tasks created" });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
