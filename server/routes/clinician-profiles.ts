import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  clinicianProfiles,
  insertClinicianProfileSchema,
  type ClinicianProfile,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_USER_ID = 1;

const profilePayloadSchema = insertClinicianProfileSchema
  .omit({ userId: true })
  .extend({
    onboardingCompleted: z.boolean().optional(),
  });

router.get("/current", async (_req, res) => {
  try {
    const [profile] = await db
      .select()
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.userId, DEFAULT_USER_ID));

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching clinician profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = profilePayloadSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.userId, DEFAULT_USER_ID));

    let profile: ClinicianProfile;

    if (existing) {
      [profile] = await db
        .update(clinicianProfiles)
        .set({
          clinicName: payload.clinicName ?? existing.clinicName,
          specialty: payload.specialty ?? existing.specialty,
          professionalNumber: payload.professionalNumber ?? existing.professionalNumber,
          locale: payload.locale ?? existing.locale,
          onboardingCompleted:
            payload.onboardingCompleted ?? existing.onboardingCompleted ?? true,
          preferences: payload.preferences ?? existing.preferences,
          updatedAt: new Date(),
        })
        .where(eq(clinicianProfiles.id, existing.id))
        .returning();
    } else {
      [profile] = await db
        .insert(clinicianProfiles)
        .values({
          userId: DEFAULT_USER_ID,
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

router.put("/:id", async (req, res) => {
  try {
    const payload = profilePayloadSchema.parse(req.body);
    const id = parseInt(req.params.id, 10);

    const [existing] = await db
      .select()
      .from(clinicianProfiles)
      .where(eq(clinicianProfiles.id, id));

    if (!existing || existing.userId !== DEFAULT_USER_ID) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const [profile] = await db
      .update(clinicianProfiles)
      .set({
        clinicName: payload.clinicName ?? existing.clinicName,
        specialty: payload.specialty ?? existing.specialty,
        professionalNumber: payload.professionalNumber ?? existing.professionalNumber,
        locale: payload.locale ?? existing.locale,
        onboardingCompleted:
          payload.onboardingCompleted ?? existing.onboardingCompleted ?? true,
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
