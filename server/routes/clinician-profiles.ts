import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  clinicianProfiles,
  insertClinicianProfileSchema,
  type ClinicianProfile,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  requireAuthenticatedUserId,
} from "../middleware/auth";

const router = Router();

const profilePayloadSchema = insertClinicianProfileSchema.omit({ userId: true }).extend({
  onboardingCompleted: z.boolean().optional(),
});

// All clinician profile routes require authentication
router.use(requireAuth);

router.get("/current", async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);

    const [profile] = await db
      .select()
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.userId, userId));

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching clinician profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const payload = profilePayloadSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.userId, userId));

    let profile: ClinicianProfile;

    if (existing) {
      [profile] = await db
        .update(clinicianProfiles)
        .set({
          clinicName: payload.clinicName ?? existing.clinicName,
          specialty: payload.specialty ?? existing.specialty,
          professionalNumber: payload.professionalNumber ?? existing.professionalNumber,
          locale: payload.locale ?? existing.locale,
          onboardingCompleted: payload.onboardingCompleted ?? existing.onboardingCompleted ?? true,
          preferences: payload.preferences ?? existing.preferences,
          updatedAt: new Date(),
        })
        .where(eq(clinicianProfiles.id, existing.id))
        .returning();
    } else {
      [profile] = await db
        .insert(clinicianProfiles)
        .values({
          userId: userId,
          clinicName: payload.clinicName ?? null,
          specialty: payload.specialty ?? null,
          professionalNumber: payload.professionalNumber ?? null,
          locale: payload.locale ?? "fr-CA",
          onboardingCompleted: payload.onboardingCompleted ?? true,
          preferences: payload.preferences ?? {},
        })
        .returning();
    }

    res.status(existing ? 200 : 201).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", errors: error.errors });
    }
    console.error("Error saving clinician profile:", error);
    res.status(500).json({ message: "Failed to save profile" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);
    const payload = profilePayloadSchema.parse(req.body);
    const id = parseInt(req.params.id, 10);

    const [existing] = await db
      .select()
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.id, id));

    // Verify the profile belongs to the authenticated user
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const [profile] = await db
      .update(clinicianProfiles)
      .set({
        clinicName: payload.clinicName ?? existing.clinicName,
        specialty: payload.specialty ?? existing.specialty,
        professionalNumber: payload.professionalNumber ?? existing.professionalNumber,
        locale: payload.locale ?? existing.locale,
        onboardingCompleted: payload.onboardingCompleted ?? existing.onboardingCompleted ?? true,
        preferences: payload.preferences ?? existing.preferences,
        updatedAt: new Date(),
      })
      .where(eq(clinicianProfiles.id, id))
      .returning();

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", errors: error.errors });
    }
    console.error("Error updating clinician profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
