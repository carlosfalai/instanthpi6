import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { medicationRefills } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { processEmailAttachments } from "../utils/emailProcessor.js";
import * as OpenAI from "openai";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All medication refill routes require authentication - PHI
router.use(requireAuth);
const openai = new OpenAI.default({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get all medication refill requests
router.get("/", async (req: Request, res: Response) => {
  try {
    const refillRequests = await db
      .select()
      .from(medicationRefills)
      .orderBy(medicationRefills.dateReceived);
    res.json(refillRequests);
  } catch (error) {
    console.error("Error fetching medication refill requests:", error);
    res.status(500).json({ error: "Failed to fetch medication refill requests" });
  }
});

// Get a specific medication refill request
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [refillRequest] = await db
      .select()
      .from(medicationRefills)
      .where(eq(medicationRefills.id, id));

    if (!refillRequest) {
      return res.status(404).json({ error: "Medication refill request not found" });
    }

    res.json(refillRequest);
  } catch (error) {
    console.error("Error fetching medication refill request:", error);
    res.status(500).json({ error: "Failed to fetch medication refill request" });
  }
});

// Get a medication refill PDF (without app layout)
router.get("/:id/pdf", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [refillRequest] = await db
      .select()
      .from(medicationRefills)
      .where(eq(medicationRefills.id, id));

    if (!refillRequest || !refillRequest.pdfUrl) {
      return res.status(404).json({ error: "Medication refill PDF not found" });
    }

    // Extract the file path from the URL
    const filePath = refillRequest.pdfUrl.replace(/^\//, ""); // Remove leading slash if present

    // Serve the file directly without the app layout
    res.sendFile(filePath, { root: "." });
  } catch (error) {
    console.error("Error serving medication refill PDF:", error);
    res.status(500).json({ error: "Failed to serve medication refill PDF" });
  }
});

// Process a medication refill request
router.post("/:id/process", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !["pending", "approved", "denied", "needs_info"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [refillRequest] = await db
      .select()
      .from(medicationRefills)
      .where(eq(medicationRefills.id, id));

    if (!refillRequest) {
      return res.status(404).json({ error: "Medication refill request not found" });
    }

    const [updatedRefill] = await db
      .update(medicationRefills)
      .set({
        status,
        processingNotes: notes || refillRequest.processingNotes,
        updatedAt: new Date(),
      })
      .where(eq(medicationRefills.id, id))
      .returning();

    res.json(updatedRefill);
  } catch (error) {
    console.error("Error processing medication refill request:", error);
    res.status(500).json({ error: "Failed to process medication refill request" });
  }
});

// Check email for new medication refill requests
router.post("/check-email", async (req: Request, res: Response) => {
  try {
    // Process email attachments to find new refill requests
    const { newAttachments, error } = await processEmailAttachments();

    if (error) {
      return res.status(500).json({ error });
    }

    if (newAttachments.length === 0) {
      return res.json({ count: 0, message: "No new refill requests found" });
    }

    // Process each attachment with AI to determine if it's a refill request
    const processedAttachments = await Promise.all(
      newAttachments.map(
        async (attachment: { url: string; content: string; emailSource: string }) => {
          try {
            // Use AI to analyze the PDF content
            const isRefillRequest = await analyzeAttachment(attachment.content);

            if (isRefillRequest.isRefill) {
              // Insert into the database based on schema structure
              const [newRefill] = await db
                .insert(medicationRefills)
                .values({
                  id: uuidv4(),
                  patientName: isRefillRequest.patientName || "Unknown Patient",
                  dateReceived: new Date(),
                  status: "pending",
                  medicationName: isRefillRequest.medicationName || "Unknown Medication",
                  prescriptionNumber: isRefillRequest.prescriptionNumber || null,
                  pharmacy: isRefillRequest.pharmacy || null,
                  pdfUrl: attachment.url,
                  emailSource: attachment.emailSource,
                  aiProcessed: true,
                  aiConfidence: isRefillRequest.confidence.toString(),
                })
                .returning();

              return newRefill;
            }

            return null;
          } catch (error) {
            console.error("Error processing attachment:", error);
            return null;
          }
        }
      )
    );

    // Filter out any null values (non-refill requests)
    const validRefills = processedAttachments.filter(Boolean);

    res.json({
      count: validRefills.length,
      message: `${validRefills.length} new refill requests found and processed`,
    });
  } catch (error) {
    console.error("Error checking email for refill requests:", error);
    res.status(500).json({ error: "Failed to check email for new refill requests" });
  }
});

// Helper function to analyze a PDF attachment with AI
async function analyzeAttachment(content: string): Promise<{
  isRefill: boolean;
  patientName?: string;
  medicationName?: string;
  prescriptionNumber?: string;
  pharmacy?: string;
  confidence: number;
}> {
  try {
    // Use OpenAI API to analyze the content
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a medical assistant AI that analyzes PDF documents to identify medication refill requests. Extract key information and return it in JSON format.",
        },
        {
          role: "user",
          content: `Analyze this document content and determine if it's a medication refill request. If it is, extract the patient name, medication name, prescription number if available, and pharmacy name if available. Return JSON with the following format:
          {
            "isRefill": boolean,
            "patientName": string or null,
            "medicationName": string or null,
            "prescriptionNumber": string or null,
            "pharmacy": string or null,
            "confidence": number between 0-1
          }
          
          Document content:
          ${content}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      isRefill: result.isRefill || false,
      patientName: result.patientName || null,
      medicationName: result.medicationName || null,
      prescriptionNumber: result.prescriptionNumber || null,
      pharmacy: result.pharmacy || null,
      confidence: result.confidence || 0,
    };
  } catch (error) {
    console.error("Error analyzing attachment with AI:", error);
    // Default to not a refill request
    return {
      isRefill: false,
      confidence: 0,
    };
  }
}

export default router;
