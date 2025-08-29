import { Router, Request, Response } from "express";
import { createFaxService, FaxService, SendFaxOptions } from "../utils/faxService";
import { db } from "../db";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { medicationRefills } from "@shared/schema";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, "../../uploads/faxes");

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "fax-" + uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept PDFs, Word docs, and images
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload PDF, Word document, or image files."));
    }
  },
});

// Initialize the fax service (null if no authentic credentials)
const faxService = createFaxService();

// Send a fax
router.post("/send", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!faxService) {
      return res.status(503).json({
        success: false,
        message: "Fax service not available. Please check API credentials.",
      });
    }

    const { to, coverPage, coverPageText, callerId, patientId, metadata } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient fax number is required",
      });
    }

    // Ensure we have a file to send
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A file to fax is required",
      });
    }

    // Send the fax
    const options: SendFaxOptions = {
      to,
      filePath: req.file.path,
      coverPage: coverPage === "true",
      coverPageText: coverPageText,
      callerId: callerId,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    };

    const result = await faxService.sendFax(options);

    if (result.success) {
      // If the fax is related to a medication refill, record that in our system
      if (patientId && req.body.isRefill === "true") {
        try {
          const patient = await storage.getPatient(parseInt(patientId));

          if (patient) {
            // Create a medication refill entry for tracking
            await db.insert(medicationRefills).values({
              id: uuidv4(),
              patientName: patient.name,
              dateReceived: new Date(),
              status: "pending",
              medicationName: req.body.medicationName || "Unknown Medication",
              pdfUrl: req.file.path,
              emailSource: "Fax",
              aiProcessed: false,
              aiConfidence: "0",
              processingNotes: `Fax sent to ${to}. Fax ID: ${result.faxId}`,
            });

            // Create a pending item for the refill
            await storage.createPendingItem({
              patientId: patient.id,
              type: "refill",
              description: `Medication Refill Faxed: ${req.body.medicationName || "Unknown Medication"}`,
              status: "pending",
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // due in 1 day
              priority: "medium",
            });
          }
        } catch (dbError) {
          console.error("Error recording fax in database:", dbError);
          // Continue even if database logging fails
        }
      }

      res.status(200).json({
        success: true,
        faxId: result.faxId,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error sending fax:", error);
    res.status(500).json({
      success: false,
      message: `Failed to send fax: ${(error as Error).message}`,
    });
  }
});

// Get fax status
router.get("/:id/status", async (req: Request, res: Response) => {
  try {
    if (!faxService) {
      return res.status(503).json({ message: "Fax service not available" });
    }

    const { id } = req.params;
    const status = await faxService.getFaxStatus(id);

    res.status(200).json({ status });
  } catch (error) {
    console.error("Error getting fax status:", error);
    res.status(500).json({
      message: `Failed to get fax status: ${(error as Error).message}`,
    });
  }
});

// List faxes with filters
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!faxService) {
      return res.status(503).json({ message: "Fax service not available" });
    }

    const { status, phoneNumber, startDate, endDate, limit = "20", direction = "sent" } = req.query;

    const options = {
      status: status as any,
      phoneNumber: phoneNumber as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      direction: direction as "sent" | "received",
    };

    const result = await faxService.listFaxes(options);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error listing faxes:", error);
    res.status(500).json({
      message: `Failed to list faxes: ${(error as Error).message}`,
    });
  }
});

// Download a fax
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    if (!faxService) {
      return res.status(503).json({ message: "Fax service not available" });
    }

    const { id } = req.params;

    // Create a directory for downloaded faxes if it doesn't exist
    const downloadDir = path.join(__dirname, "../../uploads/faxes/downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const fileName = `fax-${id}-${Date.now()}.pdf`;
    const filePath = path.join(downloadDir, fileName);

    await faxService.downloadFax(id, filePath);

    // Return file path that can be accessed by the frontend
    const relativeFilePath = `/uploads/faxes/downloads/${fileName}`;

    res.status(200).json({
      success: true,
      filePath: relativeFilePath,
    });
  } catch (error) {
    console.error("Error downloading fax:", error);
    res.status(500).json({
      success: false,
      message: `Failed to download fax: ${(error as Error).message}`,
    });
  }
});

// Check if fax service is available
router.get("/status", (req: Request, res: Response) => {
  res.status(200).json({
    available: !!faxService,
    message: faxService ? "Fax service is available" : "Fax service credentials not configured",
  });
});

export default router;
