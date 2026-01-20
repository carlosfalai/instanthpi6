import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { storage } from "../storage";
import { sendDocumentToPatient } from "../utils/emailService";
import { createFaxService } from "../utils/faxService";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All document routes require authentication - can email/fax patient documents
router.use(requireAuth);

// Initialize fax service (null if no authentic credentials)
const faxService = createFaxService();

// Email a document to a patient
router.post("/email", async (req: Request, res: Response) => {
  try {
    const { patientId, documentId, documentType, documentName } = req.body;

    // Validate inputs
    if (!patientId || !documentId || !documentType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, documentId, documentType",
      });
    }

    // Get patient information
    const patient = await storage.getPatient(parseInt(patientId));

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!patient.email) {
      return res.status(400).json({
        success: false,
        message: "Patient does not have an email address on file",
      });
    }

    // Get the document
    const document = await storage.getDocument(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Get document file
    let fileBuffer: Buffer;

    // Check if the document URL is a local file path or a remote URL
    if (document.fileUrl.startsWith("http")) {
      // Download the file from the remote URL
      const response = await axios.get(document.fileUrl, { responseType: "arraybuffer" });
      fileBuffer = Buffer.from(response.data, "binary");
    } else {
      // Read the file from local path
      const filePath = path.join(process.cwd(), document.fileUrl.replace(/^\//, ""));
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "Document file not found",
        });
      }

      fileBuffer = fs.readFileSync(filePath);
    }

    // Determine a filename for the document
    const fileName = documentName || `${documentType}-${Date.now()}.pdf`;

    // Send the document to the patient
    const result = await sendDocumentToPatient(
      parseInt(patientId),
      documentId,
      documentType,
      fileBuffer,
      fileName
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error emailing document:", error);
    res.status(500).json({
      success: false,
      message: `Failed to email document: ${(error as Error).message}`,
    });
  }
});

// Fax a document to a pharmacy or other provider
router.post("/fax", async (req: Request, res: Response) => {
  try {
    const { patientId, documentId, documentType, documentName, faxNumber } = req.body;

    // Validate inputs
    if (!patientId || !documentId || !documentType || !faxNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, documentId, documentType, faxNumber",
      });
    }

    // Validate fax number
    const cleanFaxNumber = faxNumber.replace(/[^0-9]/g, "");
    if (cleanFaxNumber.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid fax number. Please provide a valid fax number.",
      });
    }

    // Get patient information
    const patient = await storage.getPatient(parseInt(patientId));

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get the document
    const document = await storage.getDocument(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Get document file
    let filePath: string;

    // Check if the document URL is a local file path or a remote URL
    if (document.fileUrl.startsWith("http")) {
      // Download the file from the remote URL and save it to a temp file
      const response = await axios.get(document.fileUrl, { responseType: "arraybuffer" });
      const fileBuffer = Buffer.from(response.data, "binary");

      // Create directory for temp files if it doesn't exist
      const tempDir = path.join(process.cwd(), "uploads/temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write to a temp file
      const tempFilePath = path.join(tempDir, `fax-${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, fileBuffer);
      filePath = tempFilePath;
    } else {
      // Use the local file path
      filePath = path.join(process.cwd(), document.fileUrl.replace(/^\//, ""));
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "Document file not found",
        });
      }
    }

    // Send the fax
    if (!faxService) {
      return res.status(503).json({
        success: false,
        message: "Fax service not configured. Please set up PHAXIO or INTERFAX credentials.",
      });
    }

    const result = await faxService.sendFax({
      to: cleanFaxNumber,
      filePath,
      coverPage: true,
      coverPageText: `Document: ${documentName || documentType}\nPatient: ${patient.name}\nFrom: Centre Médical Font`,
    });

    // Log the fax activity
    await storage.createPatientActivity({
      patientId: parseInt(patientId),
      activityType: "document_faxed",
      description: `Document ${documentName || documentType} faxed to ${faxNumber}`,
      metadata: {
        documentId,
        documentType,
        faxSuccess: result.success,
        faxId: result.faxId,
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error faxing document:", error);
    res.status(500).json({
      success: false,
      message: `Failed to fax document: ${(error as Error).message}`,
    });
  }
});

export default router;
