import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { insertBillingEntrySchema, billingEntries } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all billing entries
router.get("/entries", async (req, res) => {
  try {
    const entries = await db.select().from(billingEntries).orderBy(billingEntries.date);
    res.json(entries);
  } catch (error) {
    console.error("Error fetching billing entries:", error);
    res.status(500).json({ error: "Failed to fetch billing entries" });
  }
});

// Create a new billing entry
router.post("/entries", async (req, res) => {
  try {
    const billingEntry = insertBillingEntrySchema.parse(req.body);

    const [newEntry] = await db
      .insert(billingEntries)
      .values({
        ...billingEntry,
        date: billingEntry.date || new Date().toISOString(),
        status: billingEntry.status || "pending",
      })
      .returning();

    res.status(201).json(newEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("Error creating billing entry:", error);
      res.status(500).json({ error: "Failed to create billing entry" });
    }
  }
});

// Update a billing entry
router.patch("/entries/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }

    const [updatedEntry] = await db
      .update(billingEntries)
      .set(req.body)
      .where(eq(billingEntries.id, id))
      .returning();

    if (!updatedEntry) {
      return res.status(404).json({ error: "Billing entry not found" });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating billing entry:", error);
    res.status(500).json({ error: "Failed to update billing entry" });
  }
});

// Delete a billing entry
router.delete("/entries/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid entry ID" });
    }

    await db.delete(billingEntries).where(eq(billingEntries.id, id));

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting billing entry:", error);
    res.status(500).json({ error: "Failed to delete billing entry" });
  }
});

export const billingRouter = router;
