import { Router, Request, Response } from "express";
import twilio from "twilio";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";

const router = Router();

// Twilio credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "ACb754b33473428f51d994ef7eaec4142d";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "bad8612f52beafad40484799a906cfca";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+14388061955";

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Multer config for image uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Interface for extracted patient data
interface ExtractedPatient {
  name: string;
  phone: string;
  confidence: "high" | "medium" | "low";
}

// Interface for invitation result
interface InvitationResult {
  name: string;
  phone: string;
  success: boolean;
  messageSid?: string;
  error?: string;
}

// Format phone number for Twilio (ensure it has country code)
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Add +1 for North America if not present
  if (cleaned.length === 10) {
    cleaned = "1" + cleaned;
  }

  // Add + prefix
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

// Extract patients from screenshot using Claude Vision
router.post(
  "/extract-patients",
  upload.single("screenshot"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No screenshot file provided",
        });
      }

      const imageBuffer = req.file.buffer;
      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      console.log(`Processing screenshot: ${req.file.originalname}, size: ${req.file.size} bytes`);

      // Use Claude Vision to extract patient data
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `Analyze this screenshot and extract all patient names and phone numbers you can find.

Return the data as a JSON array with objects containing:
- "name": the patient's full name
- "phone": their phone number (keep any formatting)
- "confidence": "high", "medium", or "low" based on how clearly you can read the data

Only return the JSON array, no other text. If you cannot find any patient data, return an empty array [].

Example output:
[
  {"name": "Jean Dupont", "phone": "514-555-1234", "confidence": "high"},
  {"name": "Marie Tremblay", "phone": "(438) 555-9876", "confidence": "medium"}
]`,
              },
            ],
          },
        ],
      });

      // Parse the response
      const textContent = response.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      let patients: ExtractedPatient[] = [];
      try {
        // Try to extract JSON from the response
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          patients = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing Claude response:", parseError);
        console.log("Raw response:", textContent.text);
      }

      console.log(`Extracted ${patients.length} patients from screenshot`);

      res.json({
        success: true,
        patients,
        totalFound: patients.length,
      });
    } catch (error: any) {
      console.error("Error extracting patients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to extract patient data from screenshot",
        error: error.message,
      });
    }
  }
);

// Send SMS invitations to multiple patients
router.post("/send-invitations", async (req: Request, res: Response) => {
  try {
    const { patients, message } = req.body as {
      patients: Array<{ name: string; phone: string }>;
      message?: string;
    };

    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No patients provided",
      });
    }

    // Default invitation message
    const invitationMessage =
      message ||
      `Bonjour! Vous etes invite(e) a rejoindre notre plateforme medicale InstantHPI pour communiquer facilement avec votre medecin via l'application Spruce. Telechargez Spruce ici: https://sprucehealth.com/download - Votre equipe medicale`;

    const results: InvitationResult[] = [];

    // Send SMS to each patient
    for (const patient of patients) {
      const formattedPhone = formatPhoneNumber(patient.phone);

      // Personalize message with patient name
      const personalizedMessage = invitationMessage.replace("{name}", patient.name);

      try {
        const twilioMessage = await twilioClient.messages.create({
          body: personalizedMessage,
          from: TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });

        results.push({
          name: patient.name,
          phone: formattedPhone,
          success: true,
          messageSid: twilioMessage.sid,
        });

        console.log(`SMS sent to ${patient.name} (${formattedPhone}): ${twilioMessage.sid}`);
      } catch (twilioError: any) {
        console.error(
          `Failed to send SMS to ${patient.name} (${formattedPhone}):`,
          twilioError.message
        );

        results.push({
          name: patient.name,
          phone: formattedPhone,
          success: false,
          error: twilioError.message,
        });
      }

      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      message: `Sent ${successCount} invitations, ${failCount} failed`,
      results,
      summary: {
        total: patients.length,
        sent: successCount,
        failed: failCount,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send invitations",
      error: error.message,
    });
  }
});

// Send a single test SMS
router.post("/send-test", async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const testMessage =
      message ||
      "Ceci est un message test de InstantHPI. Si vous recevez ce message, l'integration SMS fonctionne correctement!";

    const twilioMessage = await twilioClient.messages.create({
      body: testMessage,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`Test SMS sent to ${formattedPhone}: ${twilioMessage.sid}`);

    res.json({
      success: true,
      message: "Test SMS sent successfully",
      messageSid: twilioMessage.sid,
      phone: formattedPhone,
    });
  } catch (error: any) {
    console.error("Error sending test SMS:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test SMS",
      error: error.message,
    });
  }
});

// Health check for SMS service
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "SMS invitation service is running",
    twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
  });
});

export { router };
