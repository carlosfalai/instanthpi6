import express from "express";
import { z } from "zod";
import { insertFormResponseSchema, insertFormTemplateSchema } from "@shared/schema";
import { storage } from "../storage";

const router = express.Router();

// Get all form templates
router.get("/templates", async (req, res) => {
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
router.get("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
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
router.post("/templates", async (req, res) => {
  try {
    // For now we'll use the first user (doctor) as our default user
    // In a real app, this would come from authentication
    const userId = 1; // Doctor user ID
    
    const validateSchema = insertFormTemplateSchema.extend({
      questions: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "textarea", "radio", "checkbox", "select", "date", "number", "file"]),
        label: z.string(),
        required: z.boolean().optional().default(false),
        options: z.array(z.object({
          label: z.string(),
          value: z.string()
        })).optional(),
        placeholder: z.string().optional(),
        description: z.string().optional()
      }))
    });
    
    const templateData = validateSchema.parse({
      ...req.body,
      userId
    });
    
    const template = await storage.createFormTemplate(templateData);
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
router.put("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    // Validation schema
    const validateSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      category: z.string().optional(),
      questions: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "textarea", "radio", "checkbox", "select", "date", "number", "file"]),
        label: z.string(),
        required: z.boolean().optional().default(false),
        options: z.array(z.object({
          label: z.string(),
          value: z.string()
        })).optional(),
        placeholder: z.string().optional(),
        description: z.string().optional()
      })).optional()
    });
    
    const updateData = validateSchema.parse(req.body);
    
    const updatedTemplate = await storage.updateFormTemplate(id, updateData);
    if (!updatedTemplate) {
      return res.status(404).json({ error: "Form template not found" });
    }
    
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
router.delete("/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    const deleted = await storage.deleteFormTemplate(id);
    if (!deleted) {
      return res.status(404).json({ error: "Form template not found" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting form template:", error);
    res.status(500).json({ error: "Failed to delete form template" });
  }
});

// Get form responses for a patient
router.get("/responses/patient/:patientId", async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }
    
    const responses = await storage.getFormResponsesByPatientId(patientId);
    res.json(responses);
  } catch (error) {
    console.error("Error fetching patient form responses:", error);
    res.status(500).json({ error: "Failed to fetch form responses" });
  }
});

// Get form responses for a template
router.get("/responses/template/:templateId", async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    const responses = await storage.getFormResponsesByTemplateId(templateId);
    res.json(responses);
  } catch (error) {
    console.error("Error fetching template form responses:", error);
    res.status(500).json({ error: "Failed to fetch form responses" });
  }
});

// Get a specific form response
router.get("/responses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid response ID" });
    }
    
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
router.post("/responses", async (req, res) => {
  try {
    const responseData = insertFormResponseSchema.parse(req.body);
    
    const response = await storage.createFormResponse(responseData);
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
router.put("/responses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid response ID" });
    }
    
    // Validate the update data
    const validateSchema = z.object({
      answers: z.any().optional(),
      status: z.string().optional(),
      completedAt: z.date().nullable().optional(),
      notes: z.string().nullable().optional()
    });
    
    const updateData = validateSchema.parse(req.body);
    
    const updatedResponse = await storage.updateFormResponse(id, updateData);
    if (!updatedResponse) {
      return res.status(404).json({ error: "Form response not found" });
    }
    
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
router.delete("/responses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid response ID" });
    }
    
    const deleted = await storage.deleteFormResponse(id);
    if (!deleted) {
      return res.status(404).json({ error: "Form response not found" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting form response:", error);
    res.status(500).json({ error: "Failed to delete form response" });
  }
});

export default router;