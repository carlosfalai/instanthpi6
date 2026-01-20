import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  taskInteractions,
  priorityModels,
  prioritizedTasks,
  pendingItems,
  urgentCareRequests,
  medicationRefills,
  messages,
  users,
  patients,
  InsertTaskInteraction,
  InsertPrioritizedTask,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// Type definitions for priority model JSONB fields
interface TaskTypeWeights {
  [key: string]: number;
}

interface UrgencyWeights {
  [key: string]: number;
}

interface TimePatternWeights {
  [taskType: string]: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

// Priority AI Service - Handles physician behavior tracking and task prioritization
export class PriorityAIService {
  /**
   * Record a new task interaction for learning
   */
  async recordTaskInteraction(interaction: InsertTaskInteraction): Promise<void> {
    await db.insert(taskInteractions).values(interaction);

    // After recording enough interactions, we should retrain the model
    const interactionCount = await this.getInteractionCountForUser(interaction.userId);

    if (interactionCount % 50 === 0) {
      // Every 50 interactions, update the model
      await this.trainPriorityModel(interaction.userId);
    }
  }

  /**
   * Get the number of interactions for a specific user
   */
  async getInteractionCountForUser(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskInteractions)
      .where(eq(taskInteractions.userId, userId));

    return result[0]?.count || 0;
  }

  /**
   * Train or update priority model for a specific user based on their past interactions
   */
  async trainPriorityModel(userId: number): Promise<void> {
    // Get all user interactions
    const userInteractions = await db
      .select()
      .from(taskInteractions)
      .where(eq(taskInteractions.userId, userId))
      .orderBy(taskInteractions.timestamp);

    if (userInteractions.length < 20) {
      console.log(
        `Not enough interactions (${userInteractions.length}) to train model for user ${userId}`
      );
      return;
    }

    // Analyze patterns in interactions to create a priority model
    // This is a simplified implementation - in a real application, you would use
    // a more sophisticated machine learning approach

    // Calculate task type weights based on how quickly physician addresses different task types
    const taskTypeWeights: Record<string, number> = {};
    const patientFactorWeights: Record<string, number> = {};
    const urgencyWeights: Record<string, number> = {};
    const timePatternWeights: Record<
      string,
      { morning: number; afternoon: number; evening: number }
    > = {};

    // Simple implementation - count frequency and order in which tasks are addressed
    userInteractions.forEach((interaction) => {
      // For task types
      taskTypeWeights[interaction.taskType] = (taskTypeWeights[interaction.taskType] || 0) + 1;

      // For time patterns (simplified)
      const hour = interaction.timestamp ? new Date(interaction.timestamp).getHours() : 12;
      let timeOfDay: "morning" | "afternoon" | "evening";

      if (hour < 12) timeOfDay = "morning";
      else if (hour < 18) timeOfDay = "afternoon";
      else timeOfDay = "evening";

      if (!timePatternWeights[interaction.taskType]) {
        timePatternWeights[interaction.taskType] = { morning: 0, afternoon: 0, evening: 0 };
      }

      timePatternWeights[interaction.taskType][timeOfDay]++;

      // For context-specific weights, we would analyze the context field
      // (This would be much more sophisticated in a real application)
    });

    // Normalize weights
    const totalTaskTypeInteractions = Object.values(taskTypeWeights).reduce(
      (sum, count) => sum + count,
      0
    );
    Object.keys(taskTypeWeights).forEach((key) => {
      taskTypeWeights[key] = taskTypeWeights[key] / totalTaskTypeInteractions;
    });

    // Get existing model or create new one
    const existingModels = await db
      .select()
      .from(priorityModels)
      .where(eq(priorityModels.userId, userId))
      .orderBy(desc(priorityModels.modelVersion));

    const currentVersion = existingModels[0]?.modelVersion || 0;
    const newVersion = currentVersion + 1;

    // Make all existing models inactive
    if (existingModels.length > 0) {
      await db
        .update(priorityModels)
        .set({ active: false })
        .where(eq(priorityModels.userId, userId));
    }

    // Insert new model
    await db.insert(priorityModels).values({
      userId,
      modelVersion: newVersion,
      patientFactorWeights,
      taskTypeWeights,
      urgencyWeights,
      timePatternWeights,
      active: true,
    });

    console.log(`Created new priority model v${newVersion} for user ${userId}`);
  }

  /**
   * Get all tasks for a user and prioritize them based on learned patterns
   */
  async getPrioritizedTasksForUser(userId: number): Promise<any[]> {
    // First, get the active priority model for this user
    const models = await db
      .select()
      .from(priorityModels)
      .where(and(eq(priorityModels.userId, userId), eq(priorityModels.active, true)));

    const model = models[0];

    if (!model) {
      console.log(`No active priority model found for user ${userId}`);
      return this.getAllTasksWithDefaultPriority(userId);
    }

    // Get all tasks that need to be prioritized
    const tasks = await this.getAllTasks(userId);

    // Cast JSONB fields to proper types
    const taskTypeWeights = (model.taskTypeWeights || {}) as TaskTypeWeights;
    const urgencyWeights = (model.urgencyWeights || {}) as UrgencyWeights;
    const timePatternWeights = (model.timePatternWeights || {}) as TimePatternWeights;

    // Score each task based on the model
    const scoredTasks = tasks.map((task) => {
      const baseScore = 50; // Start with a baseline score out of 100
      let finalScore = baseScore;

      // Apply task type weight
      if (taskTypeWeights[task.taskType]) {
        finalScore += taskTypeWeights[task.taskType] * 20;
      }

      // Apply urgency weight
      if (task.urgency && urgencyWeights[task.urgency]) {
        finalScore += urgencyWeights[task.urgency] * 15;
      }

      // Apply time pattern weight
      const hour = new Date().getHours();
      let timeOfDay: "morning" | "afternoon" | "evening";

      if (hour < 12) timeOfDay = "morning";
      else if (hour < 18) timeOfDay = "afternoon";
      else timeOfDay = "evening";

      if (timePatternWeights[task.taskType]?.[timeOfDay]) {
        finalScore += timePatternWeights[task.taskType][timeOfDay] * 10;
      }

      // Apply any additional factors based on context

      // Cap score at 100
      finalScore = Math.min(100, Math.max(0, finalScore));

      return {
        ...task,
        priorityScore: finalScore,
        modelVersionUsed: model.modelVersion,
      };
    });

    // Sort by priority score (highest first)
    scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);

    // Store prioritized tasks for analysis and improvement
    for (const task of scoredTasks) {
      const prioritizedTask: InsertPrioritizedTask = {
        userId,
        taskType: task.taskType,
        taskId: task.id.toString(),
        priorityScore: task.priorityScore,
        reasoning: {
          baseFactors: {
            taskType: task.taskType,
            urgency: task.urgency,
            timeOfDay: new Date().getHours(),
          },
          modelFactors: {
            taskTypeWeight: taskTypeWeights[task.taskType] || 0,
            timePatternInfluence: timePatternWeights[task.taskType] || {},
          },
        },
        suggestedAction: this.getSuggestedAction(task),
        modelVersionUsed: model.modelVersion,
      };

      await db.insert(prioritizedTasks).values(prioritizedTask);
    }

    return scoredTasks;
  }

  /**
   * Get all tasks for a user with default priority (when no model exists)
   */
  async getAllTasksWithDefaultPriority(userId: number): Promise<any[]> {
    const tasks = await this.getAllTasks(userId);

    // Apply default prioritization rules
    const prioritizedTasks = tasks.map((task) => {
      // Simple default rules
      let priorityScore = 50;

      // Urgent care requests have higher priority
      if (task.taskType === "urgent_care") {
        priorityScore += 25;

        // With explicit priority
        if (task.urgency === "high") priorityScore += 15;
        else if (task.urgency === "medium") priorityScore += 10;
      }

      // Medication refills get medium priority
      if (task.taskType === "medication_refill") {
        priorityScore += 15;
      }

      // Newer items generally get higher priority
      const ageInDays = Math.max(
        0,
        (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (ageInDays < 1) {
        priorityScore += 10;
      } else if (ageInDays < 3) {
        priorityScore += 5;
      }

      return {
        ...task,
        priorityScore,
        reasoning: "Default priority based on task type and age",
      };
    });

    // Sort by priority score (highest first)
    return prioritizedTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Get all tasks that need physician attention from various sources
   */
  async getAllTasks(userId: number): Promise<any[]> {
    // Get pending items
    const pendingItemsList = await db
      .select({
        id: pendingItems.id,
        patientId: pendingItems.patientId,
        type: pendingItems.type,
        description: pendingItems.description,
        urgency: pendingItems.priority,
        dueDate: pendingItems.dueDate,
        createdAt: pendingItems.createdAt,
        status: pendingItems.status,
      })
      .from(pendingItems)
      .where(eq(pendingItems.status, "pending"));

    // Get urgent care requests
    const urgentCareList = await db
      .select({
        id: urgentCareRequests.id,
        patientId: urgentCareRequests.patientId,
        type: urgentCareRequests.requestType,
        description: urgentCareRequests.problemDescription,
        urgency: urgentCareRequests.priority,
        createdAt: urgentCareRequests.receivedAt,
        status: urgentCareRequests.status,
      })
      .from(urgentCareRequests)
      .where(eq(urgentCareRequests.status, "new"));

    // Get medication refill requests
    const medicationRefillList = await db
      .select({
        id: medicationRefills.id,
        patientName: medicationRefills.patientName,
        medicationName: medicationRefills.medicationName,
        createdAt: medicationRefills.dateReceived,
        status: medicationRefills.status,
      })
      .from(medicationRefills)
      .where(eq(medicationRefills.status, "pending"));

    // Get unread messages
    const messagesList = await db
      .select({
        id: messages.id,
        patientId: messages.patientId,
        content: messages.content,
        createdAt: messages.timestamp,
        isFromPatient: messages.isFromPatient,
      })
      .from(messages)
      .where(eq(messages.isFromPatient, true))
      .orderBy(desc(messages.timestamp))
      .limit(20); // Just get recent messages

    // Format tasks for unified processing
    const tasks = [
      ...pendingItemsList.map((item) => ({
        id: item.id,
        taskType: "pending_item",
        patientId: item.patientId,
        title: `${item.type}: ${item.description}`,
        description: item.description,
        urgency: item.urgency,
        createdAt: item.createdAt,
        dueDate: item.dueDate,
        status: item.status,
        originalData: item,
      })),

      ...urgentCareList.map((item) => ({
        id: item.id,
        taskType: "urgent_care",
        patientId: item.patientId,
        title: `Urgent Care: ${item.type}`,
        description: item.description,
        urgency: item.urgency,
        createdAt: item.createdAt,
        status: item.status,
        originalData: item,
      })),

      ...medicationRefillList.map((item) => ({
        id: item.id,
        taskType: "medication_refill",
        title: `Medication Refill: ${item.medicationName} for ${item.patientName}`,
        description: `${item.patientName} needs a refill for ${item.medicationName}`,
        urgency: "medium", // Default urgency for medication refills
        createdAt: item.createdAt,
        status: item.status,
        originalData: item,
      })),

      ...messagesList.map((item) => ({
        id: item.id,
        taskType: "message",
        patientId: item.patientId,
        title: "New Message",
        description:
          item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content,
        urgency: "medium", // Default urgency for messages
        createdAt: item.createdAt,
        originalData: item,
      })),
    ];

    return tasks;
  }

  /**
   * Generate a suggested action for a task
   */
  private getSuggestedAction(task: any): string {
    switch (task.taskType) {
      case "pending_item":
        return "Review and update status";
      case "urgent_care":
        return "Assess and respond to urgent care request";
      case "medication_refill":
        return "Review and approve/deny medication refill";
      case "message":
        return "Read and respond to message";
      default:
        return "Review and take appropriate action";
    }
  }

  /**
   * Get session ID for user's current session or create new one
   */
  async getOrCreateSessionId(userId: number): Promise<string> {
    // Check if user has an active session in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentInteractions = await db
      .select()
      .from(taskInteractions)
      .where(
        and(
          eq(taskInteractions.userId, userId),
          sql`${taskInteractions.timestamp} > ${oneHourAgo.toISOString()}`
        )
      )
      .orderBy(desc(taskInteractions.timestamp))
      .limit(1);

    if (recentInteractions.length > 0 && recentInteractions[0].sessionId) {
      return recentInteractions[0].sessionId;
    }

    // Create new session ID
    return uuidv4();
  }
}

export const priorityAIService = new PriorityAIService();
