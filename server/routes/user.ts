import { Router, Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const router = Router();

// Use centralized auth middleware that supports both Passport.js and Supabase JWT
const ensureAuthenticated = requireAuth;

// Route to get current user
router.get("/user", ensureAuthenticated, (req, res) => {
  res.json(req.user);
});

// Schema for validating navigation preferences
const navPreferencesSchema = z.object({
  navPreferences: z.object({
    showChronicConditions: z.boolean().optional(),
    showMedicationRefills: z.boolean().optional(),
    showUrgentCare: z.boolean().optional(),
    navItems: z
      .array(
        z.object({
          id: z.string(),
          path: z.string(),
          label: z.string(),
          visible: z.boolean(),
          order: z.number(),
          row: z.enum(["primary", "secondary"]),
          description: z.string().optional(),
        })
      )
      .optional(),
  }),
});

// Schema for scheduler preferences
const schedulerPreferencesSchema = z.object({
  schedulerPreferences: z.object({
    enabled: z.boolean().optional(),
    defaultAppointmentDuration: z.number().min(5).max(120).optional(), // in minutes
    appointmentBuffer: z.number().min(0).max(60).optional(), // in minutes
    workHours: z
      .object({
        monday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        tuesday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        wednesday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        thursday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        friday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        saturday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        sunday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      })
      .optional(),
    autoScheduleRules: z
      .array(
        z.object({
          condition: z.string(),
          frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "biannual", "annual"]),
          duration: z.number().min(5).max(120), // in minutes
        })
      )
      .optional(),
  }),
});

// Route to update navigation preferences
router.patch("/user/preferences", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validate input
    const validatedData = navPreferencesSchema.parse(req.body);

    // Update user preferences in database
    const [updatedUser] = await db
      .update(users)
      .set({
        navPreferences: validatedData.navPreferences,
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error("Error updating user preferences:", error);
    res.status(500).json({ error: "Failed to update user preferences" });
  }
});

// Route to update scheduler preferences
router.patch("/user/scheduler", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validate input
    const validatedData = schedulerPreferencesSchema.parse(req.body);

    // Update user preferences in database
    // Note: schedulerPreferences not yet added to schema - storing in navPreferences temporarily
    const [updatedUser] = await db
      .update(users)
      .set({
        navPreferences: { schedulerPreferences: validatedData.schedulerPreferences },
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error("Error updating scheduler preferences:", error);
    res.status(500).json({ error: "Failed to update scheduler preferences" });
  }
});

// Route to get notification counts
router.get("/notifications/counts", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Query database tables to get actual counts
    // If counts aren't available yet, return 0 (no placeholders)
    const counts = {
      documents: 0,
      messages: 0,
      chronicConditions: 0,
      medicationRefills: 0,
      urgentCare: 0,
      forms: 0,
    };

    // Instead of placeholder data, return actual counts
    // For now, return all zeros to avoid showing fake badge numbers
    res.json(counts);
  } catch (error) {
    console.error("Error getting notification counts:", error);
    res.status(500).json({ error: "Failed to get notification counts" });
  }
});
