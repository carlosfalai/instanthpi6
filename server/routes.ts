import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import {
  insertUserSchema,
  insertPatientSchema,
  insertMessageSchema,
  insertAiDocumentationSchema,
  insertFormSubmissionSchema,
  insertPendingItemSchema,
  medicationRefills
} from "@shared/schema";
import OpenAI from "openai";
import axios from "axios";
import { verifyRAMQCard, extractRAMQInfo } from "./utils/imageAnalysis";
import { findSubmissionByPseudonym, generateHPIConfirmationSummary } from "./utils/formsiteApi";
import { router as aiRouter } from "./routes/ai";
import { router as patientsRouter } from "./routes/patients";
import { router as spruceRouter } from "./routes/spruce";
import { router as educationRouter } from "./routes/education";
import { router as userRouter } from "./routes/user";
import formsRouter from "./routes/forms";
import { schedulerRouter } from "./routes/scheduler";
import { messagingRouter } from "./routes/messaging";
import formsiteRouter from "./routes/formsite";
import formsitePseudonymRoutes from "./routes/formsite-pseudonym";
import medicationRefillsRouter from "./routes/medication-refills";
import faxRouter from "./routes/fax";

// Initialize OpenAI API
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup Spruce Health API
const spruceApi = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register our API routers
  app.use("/api/ai", aiRouter);
  app.use("/api/patients", patientsRouter);
  app.use("/api/spruce", spruceRouter);
  app.use("/api/education", educationRouter);
  app.use("/api/forms", formsRouter);
  app.use("/api/scheduler", schedulerRouter);
  app.use("/api/messaging", messagingRouter);
  app.use("/api/formsite", formsiteRouter);
  app.use("/api/formsite-pseudonym", formsitePseudonymRoutes);
  app.use("/api/medication-refills", medicationRefillsRouter);
  app.use("/api/fax", faxRouter);
  app.use("/api", userRouter);
  
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
  
  // User routes are now handled by the userRouter

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
      
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      try {
        // Call the Spruce Health API to get today's messages for this patient
        const response = await spruceApi.get(`/patients/${patientId}/messages`, {
          params: {
            date_from: `${today}T00:00:00Z`,
            date_to: `${today}T23:59:59Z`
          }
        });
        
        // Process the Spruce API response and convert to our data format
        const spruceMessages = response.data.messages || [];
        
        // Convert Spruce messages to our format and store them
        for (const msg of spruceMessages) {
          // Check if we already have this message stored (by Spruce ID)
          const existingMessage = await storage.getMessageBySpruceId(msg.id);
          
          if (!existingMessage) {
            // Store the new message
            await storage.createMessage({
              patientId,
              senderId: msg.sender_type === 'patient' ? patientId : 1, // 1 for doctor
              content: msg.content,
              isFromPatient: msg.sender_type === 'patient',
              spruceMessageId: msg.id
            });
          }
        }
      } catch (spruceError) {
        console.error("Error fetching messages from Spruce API:", spruceError);
        // We'll continue and return locally stored messages even if Spruce API fails
      }
      
      // Return all messages for this patient from our database
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
      
      // Process the message to detect medication refill requests
      if (message.content && (
        message.content.toLowerCase().includes('refill') || 
        message.content.toLowerCase().includes('prescription') ||
        message.content.toLowerCase().includes('medication')
      )) {
        // Process with AI to determine if it's a refill request
        try {
          // We already have openai client initialized at the top level
          // Use the existing OpenAI instance
          
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages: [
              {
                role: "system",
                content: "You are a medical assistant AI that analyzes patient messages to identify medication refill requests. Extract key information and return it in JSON format."
              },
              {
                role: "user",
                content: `Analyze this patient message and determine if it's a medication refill request. If it is, extract the patient name, medication name if mentioned. Return JSON with the following format:
                {
                  "isRefill": boolean,
                  "patientName": string or null,
                  "medicationName": string or null,
                  "confidence": number between 0-1
                }
                
                Patient message:
                ${message.content}`
              }
            ],
            response_format: { type: "json_object" }
          });
          
          const result = JSON.parse(aiResponse.choices[0].message.content || "{}");
          
          // If this is a refill request, create a medication refill entry
          if (result.isRefill) {
            console.log("Detected medication refill request in patient message");
            
            // Get patient details
            const patient = await storage.getPatient(message.patientId);
            
            // Create a medication refill entry
            await db.insert(medicationRefills).values({
              id: uuidv4(),
              patientName: patient ? patient.name : (result.patientName || "Unknown Patient"),
              dateReceived: new Date(),
              status: "pending",
              medicationName: result.medicationName || "Medication in message",
              pdfUrl: "",  // No PDF for message-based requests
              emailSource: "Patient message",
              aiProcessed: true,
              aiConfidence: result.confidence.toString(),
              processingNotes: `Detected in patient message: "${message.content}"`,
            });
            
            // Create a pending item for the refill
            if (patient) {
              await storage.createPendingItem({
                patientId: patient.id,
                type: "refill",
                description: `Medication Refill Request: ${result.medicationName || "medication"}`,
                status: "pending",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // due in 1 day
                priority: "medium"
              });
            }
          }
        } catch (aiError) {
          console.error("Error detecting medication refill in message:", aiError);
          // Continue processing even if AI analysis fails
        }
      }
      
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
  
  // New AI Message Generation endpoint for patient communications
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, patientId, patientLanguage = 'english', maxLength = 5 } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Missing prompt" });
      }
      
      // Get patient information if patientId is provided
      let patient = null;
      if (patientId) {
        try {
          patient = await storage.getPatient(parseInt(patientId));
        } catch (error) {
          console.warn(`Could not fetch patient with ID ${patientId}:`, error);
        }
      }
      
      // Determine language based on patient preference if not explicitly specified
      const language = patientLanguage || (patient?.language || 'english');
      
      // Create system prompt based on language
      const systemMessage = language === 'french' 
        ? `Vous êtes un assistant médical rédigeant des messages pour un médecin à ses patients. Répondez en français de manière professionnelle mais chaleureuse. Limitez votre réponse à ${maxLength} phrases maximum, dans un seul paragraphe. Utilisez un ton spartiate et direct. N'utilisez pas de formules de politesse excessives.`
        : `You are a medical assistant crafting messages for a doctor to send to patients. Respond in English in a professional but warm manner. Limit your response to ${maxLength} sentences maximum, in a single paragraph. Use a spartan and direct tone. Do not use excessive politeness.`;
      
      // Use Anthropic if available (better multilingual abilities)
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          // Import Anthropic SDK dynamically
          const Anthropic = require('@anthropic-ai/sdk');
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });
          
          // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
          const response = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            system: systemMessage,
            max_tokens: 1024,
            messages: [
              { role: 'user', content: prompt }
            ],
          });
          
          return res.json({ text: response.content[0].text.trim() });
        } catch (error) {
          console.error("Error using Anthropic:", error);
          // Fall back to OpenAI if Anthropic fails
        }
      }
      
      // Use OpenAI as fallback
      if (process.env.OPENAI_API_KEY) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
        });
        
        return res.json({ text: response.choices[0].message.content?.trim() || "No response generated" });
      }
      
      // No API keys available, return error
      return res.status(503).json({ message: "AI services not configured" });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  // Spruce Health API proxy
  app.post("/api/spruce/messages", async (req, res) => {
    try {
      const { patientId, message, messageType } = req.body;
      
      if (!patientId || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      try {
        // Send the message through Spruce API
        const spruceResponse = await spruceApi.post(`/messages`, {
          patient_id: patientId,
          content: message,
          message_type: messageType || 'GENERAL',
          sender_id: 1, // Doctor ID
        });
        
        // Get the Spruce message ID from the response
        const spruceMessageId = spruceResponse.data.id;
        
        // Save the message to our database
        const savedMessage = await storage.createMessage({
          patientId,
          senderId: 1, // Assume doctor with ID 1
          content: message,
          isFromPatient: false,
          spruceMessageId: spruceMessageId
        });
        
        res.json(savedMessage);
      } catch (spruceError) {
        console.error("Error sending message to Spruce API:", spruceError);
        
        // Fallback: Save the message to our database even if Spruce API fails
        const savedMessage = await storage.createMessage({
          patientId,
          senderId: 1, // Assume doctor with ID 1
          content: message,
          isFromPatient: false,
          spruceMessageId: `local-${Date.now()}`
        });
        
        res.json(savedMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Formsite API proxy
  app.get("/api/formsite/submissions", async (req, res) => {
    try {
      const { formType } = req.query;
      
      if (!formType) {
        return res.status(400).json({ message: "Missing form type parameter" });
      }

      // Call Formsite API using the API key
      try {
        const formsiteClient = axios.create({
          baseURL: 'https://fs3.formsite.com/api/v2',
          headers: {
            'Authorization': `Bearer ${process.env.FORMSITE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        // This would be replaced with the actual form ID from your Formsite account
        const formId = formType === 'urgent_care' ? 'form1' : 'form2';
        
        const response = await formsiteClient.get(`/forms/${formId}/results`, {
          params: {
            sort: 'date_desc',
            limit: 10
          }
        });
        
        res.json({ 
          formType, 
          data: response.data 
        });
      } catch (formsiteError) {
        console.error("Error connecting to Formsite API:", formsiteError);
        res.status(500).json({ message: "Failed to fetch form data from Formsite" });
      }
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ message: "Failed to fetch form submissions" });
    }
  });

  // Patient verification endpoints
  // 1. RAMQ Card verification endpoint
  app.post("/api/verify/ramq-card", async (req, res) => {
    try {
      const { patientId, imageBase64 } = req.body;
      
      if (!patientId || !imageBase64) {
        return res.status(400).json({ message: "Missing patient ID or image data" });
      }
      
      // Verify the RAMQ card
      const verificationResult = await verifyRAMQCard(imageBase64);
      
      if (!verificationResult.isValid || verificationResult.confidence < 0.7) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message || "The image does not appear to be a valid RAMQ health insurance card. Please provide a clear photo of the front of your RAMQ card."
        });
      }
      
      // Extract information from the RAMQ card
      const extractionResult = await extractRAMQInfo(imageBase64);
      
      // Update patient record with RAMQ information if available
      if (extractionResult.success && extractionResult.ramqNumber) {
        await storage.updatePatient(patientId, {
          healthCardNumber: extractionResult.ramqNumber
        });
      }
      
      // Return success response with extraction data
      res.json({
        success: true,
        message: "RAMQ card verified successfully",
        data: {
          name: extractionResult.name,
          cardNumber: extractionResult.ramqNumber,
          expirationDate: extractionResult.expirationDate
        }
      });
    } catch (error) {
      console.error("Error verifying RAMQ card:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process RAMQ card verification"
      });
    }
  });
  
  // 2. Pseudonym verification and form submission retrieval
  app.post("/api/verify/pseudonym", async (req, res) => {
    try {
      const { patientId, pseudonym } = req.body;
      
      if (!patientId || !pseudonym) {
        return res.status(400).json({ 
          success: false,
          message: "Missing patient ID or pseudonym"
        });
      }
      
      // Find form submission by pseudonym
      const formResult = await findSubmissionByPseudonym(pseudonym);
      
      if (!formResult.success) {
        return res.status(404).json({
          success: false,
          message: formResult.message || "No form submission found with this pseudonym. Please check and try again."
        });
      }
      
      // Generate HPI confirmation summary
      const hpiSummary = await generateHPIConfirmationSummary(
        formResult.formType!, 
        formResult.formData!
      );
      
      // Save form submission to database
      const submission = await storage.createFormSubmission({
        patientId,
        formType: formResult.formType!,
        formData: formResult.formData!,
        submissionId: pseudonym
      });
      
      // Send a message to the patient with the HPI summary via Spruce
      try {
        const welcomeMessage = `Thank you for providing your form information. Here's a summary of your health information:
        
${hpiSummary}

Is this information correct? If not, please let us know what needs to be corrected.`;
        
        // Send the message through Spruce API
        const spruceResponse = await spruceApi.post(`/messages`, {
          patient_id: patientId,
          content: welcomeMessage,
          message_type: 'MEDICAL',
          sender_id: 1, // Doctor ID
        });
        
        // Save the message to our database
        await storage.createMessage({
          patientId,
          senderId: 1, // Assume doctor with ID 1
          content: welcomeMessage,
          isFromPatient: false,
          spruceMessageId: spruceResponse.data.id
        });
      } catch (spruceError) {
        console.error("Error sending HPI summary to patient:", spruceError);
        // Continue processing even if message sending fails
      }
      
      // Return success response with form data
      res.json({
        success: true,
        message: "Form submission verified and processed successfully",
        data: {
          formType: formResult.formType,
          hpiSummary,
          submissionId: submission.id
        }
      });
    } catch (error) {
      console.error("Error verifying pseudonym:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process pseudonym verification"
      });
    }
  });
  
  // 3. Combined verification endpoint (for automating the whole process)
  app.post("/api/verify/patient", async (req, res) => {
    try {
      const { patientId, ramqImageBase64, pseudonym } = req.body;
      
      if (!patientId || !ramqImageBase64 || !pseudonym) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required verification data" 
        });
      }
      
      // Step 1: Verify RAMQ card
      const ramqResult = await verifyRAMQCard(ramqImageBase64);
      
      if (!ramqResult.isValid || ramqResult.confidence < 0.7) {
        return res.status(400).json({
          success: false,
          step: "ramq",
          message: ramqResult.message || "The image does not appear to be a valid RAMQ health insurance card."
        });
      }
      
      // Extract RAMQ information
      const ramqInfo = await extractRAMQInfo(ramqImageBase64);
      
      // Step 2: Verify pseudonym and get form data
      const formResult = await findSubmissionByPseudonym(pseudonym);
      
      if (!formResult.success) {
        return res.status(404).json({
          success: false,
          step: "pseudonym",
          message: formResult.message || "No form submission found with this pseudonym."
        });
      }
      
      // Step 3: Generate HPI confirmation summary
      const hpiSummary = await generateHPIConfirmationSummary(
        formResult.formType!, 
        formResult.formData!
      );
      
      // Step 4: Save form submission to database
      const submission = await storage.createFormSubmission({
        patientId,
        formType: formResult.formType!,
        formData: formResult.formData!,
        submissionId: pseudonym
      });
      
      // Step 5: Send a message to the patient with the HPI summary via Spruce
      try {
        const welcomeMessage = `Thank you for completing your verification process. Here's a summary of the information you provided:
        
${hpiSummary}

Is this information correct? If not, please let us know what needs to be corrected.`;
        
        // Send the message through Spruce API
        const spruceResponse = await spruceApi.post(`/messages`, {
          patient_id: patientId,
          content: welcomeMessage,
          message_type: 'MEDICAL',
          sender_id: 1, // Doctor ID
        });
        
        // Save the message to our database
        await storage.createMessage({
          patientId,
          senderId: 1, // Assume doctor with ID 1
          content: welcomeMessage,
          isFromPatient: false,
          spruceMessageId: spruceResponse.data.id
        });
      } catch (spruceError) {
        console.error("Error sending HPI summary to patient:", spruceError);
        // Continue processing even if message sending fails
      }
      
      // Return success response with all verification data
      res.json({
        success: true,
        message: "Patient verification completed successfully",
        data: {
          ramq: {
            name: ramqInfo.name,
            cardNumber: ramqInfo.ramqNumber,
            expirationDate: ramqInfo.expirationDate
          },
          form: {
            formType: formResult.formType,
            submissionId: submission.id
          },
          hpiSummary
        }
      });
    } catch (error) {
      console.error("Error in patient verification process:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to complete patient verification process"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
