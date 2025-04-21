import { Router } from "express";
import { storage } from "../storage";
import { DbEducationStorage } from "../db";
import { z } from "zod";
import { insertEducationModuleSchema, insertUserEducationProgressSchema } from "@shared/schema";

// Initialize database storage for education modules
const dbEducationStorage = new DbEducationStorage();

export const router = Router();

// Get all education modules
router.get("/modules", async (req, res) => {
  try {
    // Use the database adapter instead of memory storage
    const modules = await dbEducationStorage.getAllEducationModules();
    res.json(modules);
  } catch (error) {
    console.error("Error fetching education modules:", error);
    res.status(500).json({ error: "Failed to fetch education modules" });
  }
});

// Get a specific education module
router.get("/modules/:id", async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    if (isNaN(moduleId)) {
      return res.status(400).json({ error: "Invalid module ID" });
    }

    const module = await dbEducationStorage.getEducationModule(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

// Create a new education module
router.post("/modules", async (req, res) => {
  try {
    // Validate request body
    const validatedData = insertEducationModuleSchema.parse(req.body);
    const module = await storage.createEducationModule(validatedData);
    res.status(201).json(module);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating module:", error);
    res.status(500).json({ error: "Failed to create module" });
  }
});

// Update an education module
router.patch("/modules/:id", async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    if (isNaN(moduleId)) {
      return res.status(400).json({ error: "Invalid module ID" });
    }

    // Validate request body
    const validatedData = insertEducationModuleSchema.partial().parse(req.body);
    const updatedModule = await storage.updateEducationModule(moduleId, validatedData);
    
    if (!updatedModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json(updatedModule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Failed to update module" });
  }
});

// Delete an education module
router.delete("/modules/:id", async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    if (isNaN(moduleId)) {
      return res.status(400).json({ error: "Invalid module ID" });
    }

    const deleted = await storage.deleteEducationModule(moduleId);
    if (!deleted) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ error: "Failed to delete module" });
  }
});

// Get progress for current user
router.get("/progress", async (req, res) => {
  try {
    // For now we'll use the first user (doctor) as our default user
    // In a real app, this would come from authentication
    const userId = 1; // Doctor user ID
    const progress = await dbEducationStorage.getUserEducationProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// Update or create progress for a module
router.post("/progress", async (req, res) => {
  try {
    // For now we'll use the first user (doctor) as our default user
    // In a real app, this would come from authentication
    const userId = 1; // Doctor user ID
    
    const schema = z.object({
      moduleId: z.number(),
      status: z.enum(["not_started", "in_progress", "completed"]),
      quizScore: z.number().optional(),
      notes: z.string().optional()
    });

    const { moduleId, status, quizScore, notes } = schema.parse(req.body);
    
    // Check if progress already exists
    const existingProgress = await dbEducationStorage.getModuleProgress(userId, moduleId);
    
    if (existingProgress) {
      // Update existing progress
      const now = new Date();
      const completedAt = status === "completed" ? now : null;
      
      const updatedProgress = await dbEducationStorage.updateUserEducationProgress(existingProgress.id, {
        status,
        completedAt,
        quizScore,
        notes
      });
      
      return res.json(updatedProgress);
    } else {
      // Create new progress
      const now = new Date();
      const completedAt = status === "completed" ? now : null;
      
      const newProgress = await dbEducationStorage.createUserEducationProgress({
        userId,
        moduleId,
        status,
        completedAt,
        quizScore,
        notes
      });
      
      return res.status(201).json(newProgress);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// Get unlocked features for current user
router.get("/unlocked-features", async (req, res) => {
  try {
    // For now we'll use the first user (doctor) as our default user
    // In a real app, this would come from authentication
    const userId = 1; // Doctor user ID
    const unlockedFeatures = await dbEducationStorage.getUserUnlockedFeatures(userId);
    res.json(unlockedFeatures);
  } catch (error) {
    console.error("Error fetching unlocked features:", error);
    res.status(500).json({ error: "Failed to fetch unlocked features" });
  }
});