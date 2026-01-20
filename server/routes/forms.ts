import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertFormTemplateSchema, insertFormResponseSchema } from "@shared/schema";
import {
  requireAuth,
  requireAuthenticatedUserId,
} from "../middleware/auth";

const router = Router();

// All form routes require authentication
router.use(requireAuth);

// ============================================================================
// TEMPLATE ROUTES
// ============================================================================

// Get all form templates
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    let templates;

    if (category) {
      templates = await storage.getFormTemplatesByCategory(category);
    } else {
      templates = await storage.getAllFormTemplates();
    }

    res.json(templates);
  } catch (error) {
    console.error("Error fetching form templates:", error);
    res.status(500).json({ error: "Failed to fetch form templates" });
  }
});

// Get a specific form template
router.get("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const template = await storage.getFormTemplate(id);

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching form template:", error);
    res.status(500).json({ error: "Failed to fetch form template" });
  }
});

// Create a new form template
router.post("/templates", async (req: Request, res: Response) => {
  try {
    const userId = requireAuthenticatedUserId(req);

    const validatedData = insertFormTemplateSchema.parse({
      ...req.body,
      userId,
    });

    const template = await storage.createFormTemplate(validatedData);
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating form template:", error);
    res.status(500).json({ error: "Failed to create form template" });
  }
});

// Update a form template
router.put("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const template = await storage.getFormTemplate(id);

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    const validatedData = insertFormTemplateSchema.partial().parse(req.body);
    const updatedTemplate = await storage.updateFormTemplate(id, validatedData);

    res.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating form template:", error);
    res.status(500).json({ error: "Failed to update form template" });
  }
});

// Delete a form template
router.delete("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteFormTemplate(id);

    if (!success) {
      return res.status(404).json({ error: "Form template not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting form template:", error);
    res.status(500).json({ error: "Failed to delete form template" });
  }
});

// ============================================================================
// RESPONSE ROUTES
// ============================================================================

// Get form responses by patient ID
router.get("/responses/patient/:patientId", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const responses = await storage.getFormResponsesByPatientId(patientId);
    res.json(responses);
  } catch (error) {
    console.error("Error fetching form responses:", error);
    res.status(500).json({ error: "Failed to fetch form responses" });
  }
});

// Get form responses by template ID
router.get("/responses/template/:templateId", async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const responses = await storage.getFormResponsesByTemplateId(templateId);
    res.json(responses);
  } catch (error) {
    console.error("Error fetching form responses:", error);
    res.status(500).json({ error: "Failed to fetch form responses" });
  }
});

// Get a specific form response
router.get("/responses/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const response = await storage.getFormResponse(id);

    if (!response) {
      return res.status(404).json({ error: "Form response not found" });
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching form response:", error);
    res.status(500).json({ error: "Failed to fetch form response" });
  }
});

// Create a new form response
router.post("/responses", async (req: Request, res: Response) => {
  try {
    const validatedData = insertFormResponseSchema.parse(req.body);
    const response = await storage.createFormResponse(validatedData);
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating form response:", error);
    res.status(500).json({ error: "Failed to create form response" });
  }
});

// Update a form response
router.put("/responses/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const response = await storage.getFormResponse(id);

    if (!response) {
      return res.status(404).json({ error: "Form response not found" });
    }

    const validatedData = insertFormResponseSchema.partial().parse(req.body);
    const updatedResponse = await storage.updateFormResponse(id, validatedData);

    res.json(updatedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating form response:", error);
    res.status(500).json({ error: "Failed to update form response" });
  }
});

// Delete a form response
router.delete("/responses/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteFormResponse(id);

    if (!success) {
      return res.status(404).json({ error: "Form response not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting form response:", error);
    res.status(500).json({ error: "Failed to delete form response" });
  }
});

export default router;
