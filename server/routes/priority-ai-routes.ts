import { Router, Request, Response } from "express";
import { priorityAIService } from "../services/priority-ai-service";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { taskInteractions, priorityModels } from "@shared/schema";

// Define the authenticated request type
interface AuthRequest extends Request {
  isAuthenticated(): boolean;
  user?: any;
}

const priorityAIRouter = Router();

// Schema for tracking task interactions
const recordInteractionSchema = z.object({
  taskType: z.string(),
  taskId: z.string(),
  action: z.string(),
  orderInSession: z.number().optional(),
  timeSpent: z.number().optional(),
  context: z.record(z.any()).optional(),
});

// Get prioritized tasks for the current user
priorityAIRouter.get("/priority/tasks", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;
    const prioritizedTasks = await priorityAIService.getPrioritizedTasksForUser(userId);

    res.json({
      success: true,
      tasks: prioritizedTasks,
    });
  } catch (error) {
    console.error("Error fetching prioritized tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prioritized tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Record a task interaction for learning
priorityAIRouter.post("/priority/interaction", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;
    const validatedData = recordInteractionSchema.parse(req.body);

    // Get or create a session ID
    const sessionId = await priorityAIService.getOrCreateSessionId(userId);

    // Record the interaction
    await priorityAIService.recordTaskInteraction({
      userId,
      taskType: validatedData.taskType,
      taskId: validatedData.taskId,
      action: validatedData.action,
      sessionId,
      orderInSession: validatedData.orderInSession,
      timeSpent: validatedData.timeSpent,
      context: validatedData.context || {},
    });

    res.json({
      success: true,
      message: "Interaction recorded successfully",
    });
  } catch (error) {
    console.error("Error recording task interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record task interaction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get info about the current user's priority model
priorityAIRouter.get("/priority/model", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;

    // Get the active model for the user
    const [activeModel] = await db
      .select()
      .from(priorityModels)
      .where(and(eq(priorityModels.userId, userId), eq(priorityModels.active, true)));

    // Get count of user's recorded interactions
    const interactionCount = await priorityAIService.getInteractionCountForUser(userId);

    res.json({
      success: true,
      modelExists: !!activeModel,
      modelVersion: activeModel?.modelVersion || 0,
      interactionCount,
      modelCreatedAt: activeModel?.createdAt || null,
      accuracy: activeModel?.accuracy || null,
      needsMoreData: interactionCount < 20,
    });
  } catch (error) {
    console.error("Error fetching priority model info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch priority model info",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Manually trigger model training (for testing)
priorityAIRouter.post("/priority/train", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;

    // Check if user has enough interactions for training
    const interactionCount = await priorityAIService.getInteractionCountForUser(userId);

    if (interactionCount < 20) {
      return res.status(400).json({
        success: false,
        message: "Not enough interactions to train model. Need at least 20 interactions.",
      });
    }

    // Train the model
    await priorityAIService.trainPriorityModel(userId);

    res.json({
      success: true,
      message: "Priority model trained successfully",
    });
  } catch (error) {
    console.error("Error training priority model:", error);
    res.status(500).json({
      success: false,
      message: "Failed to train priority model",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default priorityAIRouter;
