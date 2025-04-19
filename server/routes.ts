import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import {
  insertUserSchema,
  insertPatientSchema,
  insertMessageSchema,
  insertAiDocumentationSchema,
  insertFormSubmissionSchema
} from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI API
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "Internal server error" });
  };

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Patient routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientData = insertPatientSchema.partial().parse(req.body);
      const updatedPatient = await storage.updatePatient(id, patientData);
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(updatedPatient);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Message routes
  app.get("/api/patients/:patientId/messages", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const messages = await storage.getMessagesByPatientId(patientId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // AI Documentation routes
  app.get("/api/patients/:patientId/documentation", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const documentation = await storage.getDocumentationByPatientId(patientId);
      if (!documentation) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      res.json(documentation);
    } catch (error) {
      console.error("Error fetching documentation:", error);
      res.status(500).json({ message: "Failed to fetch documentation" });
    }
  });

  app.post("/api/documentation", async (req, res) => {
    try {
      const docData = insertAiDocumentationSchema.parse(req.body);
      const documentation = await storage.createDocumentation(docData);
      res.status(201).json(documentation);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/documentation/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const docData = insertAiDocumentationSchema.partial().parse(req.body);
      const updatedDoc = await storage.updateDocumentation(id, docData);
      if (!updatedDoc) {
        return res.status(404).json({ message: "Documentation not found" });
      }
      res.json(updatedDoc);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Form Submission routes
  app.get("/api/patients/:patientId/formsubmissions", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const submissions = await storage.getFormSubmissionsByPatientId(patientId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ message: "Failed to fetch form submissions" });
    }
  });

  app.post("/api/formsubmissions", async (req, res) => {
    try {
      const submissionData = insertFormSubmissionSchema.parse(req.body);
      const submission = await storage.createFormSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // AI Generation endpoint
  app.post("/api/generate-documentation", async (req, res) => {
    try {
      const { patientId, formData, patientMessages } = req.body;

      if (!patientId || !formData) {
        return res.status(400).json({ message: "Missing required data" });
      }

      // Construct prompt for OpenAI
      const prompt = `
        Generate medical documentation based on the following patient information:
        
        Form data: ${JSON.stringify(formData)}
        
        ${patientMessages ? `Recent messages: ${JSON.stringify(patientMessages)}` : ''}
        
        Please provide a complete set of medical documentation including:
        1. History of Present Illness (HPI)
        2. SOAP Notes (Subjective, Objective, Assessment, and Plan)
        3. Prescription recommendation (if applicable)
        4. Follow-up questions for the patient
        
        Format the response as a JSON object with the following keys:
        - hpi: string (History of Present Illness)
        - subjective: string (Subjective section of SOAP notes)
        - objective: string (Objective section of SOAP notes)
        - assessment: string (Assessment section of SOAP notes)
        - plan: string (Plan section of SOAP notes)
        - prescription: object (medication details, if applicable)
        - followUpQuestions: array of strings (follow-up questions for the patient)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an AI medical assistant generating clinical documentation for a physician." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const aiContent = JSON.parse(response.choices[0].message.content || "{}");
      
      // Save the generated documentation to storage
      const documentation = await storage.createDocumentation({
        patientId,
        hpi: aiContent.hpi || "",
        subjective: aiContent.subjective || "",
        objective: aiContent.objective || "",
        assessment: aiContent.assessment || "",
        plan: aiContent.plan || "",
        prescription: aiContent.prescription || null,
        followUpQuestions: aiContent.followUpQuestions || [],
        isApproved: false
      });

      res.json(documentation);
    } catch (error) {
      console.error("Error generating documentation:", error);
      res.status(500).json({ message: "Failed to generate documentation" });
    }
  });

  // Spruce Health API proxy
  app.post("/api/spruce/messages", async (req, res) => {
    try {
      const { patientId, message } = req.body;
      
      if (!patientId || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // This would normally call Spruce API, but we'll mock the response for now
      // In a real implementation, you would make an HTTP request to Spruce's API
      
      // Save the message to our database
      const savedMessage = await storage.createMessage({
        patientId,
        senderId: 1, // Assume doctor with ID 1
        content: message,
        isFromPatient: false,
        spruceMessageId: `spruce-${Date.now()}` // Mock Spruce ID
      });

      res.json(savedMessage);
    } catch (error) {
      console.error("Error sending message to Spruce:", error);
      res.status(500).json({ message: "Failed to send message to Spruce" });
    }
  });

  // Formsite API proxy
  app.get("/api/formsite/submissions", async (req, res) => {
    try {
      const { formType } = req.query;
      
      if (!formType) {
        return res.status(400).json({ message: "Missing form type parameter" });
      }

      // This would normally call Formsite API, but we'll return mock data for demonstration
      // In a real implementation, you would make an HTTP request to Formsite's API
      
      // Mock form submission retrieval
      // Would be replaced with actual API call to Formsite
      const mockFormData = {
        urgent_care: {
          symptoms: "Sore throat, fever, fatigue",
          duration: "3 days",
          severity: "moderate",
          temperature: "101.2°F",
          allergies: "None",
          medications: "Tylenol"
        },
        std_checkup: {
          symptoms: "No symptoms",
          lastTest: "6 months ago",
          sexualHistory: "2 partners in last year",
          protection: "Sometimes",
          concerns: "Routine checkup"
        }
      };
      
      res.json({ 
        formType, 
        data: mockFormData[formType as keyof typeof mockFormData] || {} 
      });
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ message: "Failed to fetch form submissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
