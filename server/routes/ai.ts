import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Spruce API configuration (for future use)
const SPRUCE_ACCESS_ID = process.env.SPRUCE_ACCESS_ID;
const SPRUCE_API_KEY = process.env.SPRUCE_API_KEY;

export const router = Router();

// Get AI suggestions for a patient
router.get("/suggestions", async (req, res) => {
  try {
    const { patientId, language = "english" } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // This would normally fetch real suggestions from an AI model
    // based on patient data, conversation history, etc.

    // For now, we'll return mock suggestions to test the UI
    const suggestions = [
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Ressentez-vous toujours des douleurs abdominales?"
            : "Are you still experiencing abdominal pain?",
        type: "followup",
      },
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Avez-vous pris les médicaments comme prescrit?"
            : "Have you been taking the medication as prescribed?",
        type: "followup",
      },
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Avez-vous remarqué d'autres symptômes?"
            : "Have you noticed any other symptoms?",
        type: "followup",
      },
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Continuer le traitement actuel pendant 7 jours"
            : "Continue current treatment for 7 days",
        type: "plan",
      },
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Programmer une visite de suivi dans 2 semaines"
            : "Schedule follow-up visit in 2 weeks",
        type: "plan",
      },
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Bonjour, comment vous sentez-vous aujourd'hui? Je suis disponible pour répondre à vos questions."
            : "Hello, how are you feeling today? I am available to answer any questions you may have.",
        type: "response",
      },
      {
        id: uuidv4(),
        text:
          language === "french"
            ? "Je vous recommande de vous reposer et de bien vous hydrater. Contactez-moi si les symptômes s'aggravent."
            : "I recommend getting plenty of rest and staying hydrated. Please contact me if your symptoms worsen.",
        type: "response",
      },
    ];

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    res.status(500).json({ message: "Failed to fetch AI suggestions" });
  }
});

// Chat endpoint for Command Center AI
router.post("/chat", async (req, res) => {
  try {
    const { prompt, model = "claude-3-5-haiku-20241022", systemPrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Missing prompt" });
    }

    // Use Anthropic Claude
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: model,
          system: systemPrompt || "You are a helpful medical assistant.",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        const firstBlock = response.content[0];
        const text = firstBlock.type === 'text' ? firstBlock.text : '';
        return res.json({ content: text.trim() });
      } catch (error) {
        console.error("Anthropic error:", error);
        // Fall through to OpenAI
      }
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful medical assistant." },
          { role: "user", content: prompt },
        ],
      });

      return res.json({ content: response.choices[0].message.content?.trim() || "" });
    }

    return res
      .status(503)
      .json({ message: "AI services not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY." });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "AI chat failed" });
  }
});

// Generate AI response
router.post("/generate", async (req, res) => {
  try {
    const { prompt, patientId, patientLanguage = "english", maxLength = 5 } = req.body;

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
    const language = patientLanguage || patient?.language || "english";

    // Create system prompt based on language
    const systemMessage =
      language === "french"
        ? `Vous êtes un assistant médical rédigeant des messages pour un médecin à ses patients. Répondez en français de manière professionnelle mais chaleureuse. Limitez votre réponse à ${maxLength} phrases maximum, dans un seul paragraphe. Utilisez un ton spartiate et direct. N'utilisez pas de formules de politesse excessives.`
        : `You are a medical assistant crafting messages for a doctor to send to patients. Respond in English in a professional but warm manner. Limit your response to ${maxLength} sentences maximum, in a single paragraph. Use a spartan and direct tone. Do not use excessive politeness.`;

    // Use Anthropic if available (better multilingual abilities)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        // Import Anthropic SDK dynamically
        const Anthropic = require("@anthropic-ai/sdk");
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Using Claude 3.5 Haiku as default (fast and cost-effective)
        const response = await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          system: systemMessage,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
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
          { role: "user", content: prompt },
        ],
      });

      return res.json({ text: response.choices[0].message.content?.trim() || "" });
    }

    // No API keys available, return error
    return res.status(503).json({ message: "AI services not configured" });
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({ message: "Failed to generate AI response" });
  }
});

// Generate documentation based on patient data
router.post("/generate-documentation", async (req, res) => {
  try {
    const { patientId, formData, patientMessages } = req.body;

    if (!patientId || !formData) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // Construct prompt for OpenAI
    const prompt = `
      Generate medical documentation based on the following patient information:
      
      Form data: ${JSON.stringify(formData)}
      
      ${patientMessages ? `Recent messages: ${JSON.stringify(patientMessages)}` : ""}
      
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
        {
          role: "system",
          content:
            "You are an AI medical assistant generating clinical documentation for a physician.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const aiContent = JSON.parse(response.choices[0].message.content || "{}");

    // Save the generated documentation to storage
    const documentation = await storage.createDocumentation({
      patientId: parseInt(patientId),
      hpi: aiContent.hpi || "",
      subjective: aiContent.subjective || "",
      objective: aiContent.objective || "",
      assessment: aiContent.assessment || "",
      plan: aiContent.plan || "",
      prescription: aiContent.prescription || null,
      followUpQuestions: aiContent.followUpQuestions || [],
      isApproved: false,
    });

    res.json(documentation);
  } catch (error) {
    console.error("Error generating documentation:", error);
    res.status(500).json({ message: "Failed to generate documentation" });
  }
});
