import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate HPI Confirmation Summary using AI
router.post("/generate-hpi-summary", async (req, res) => {
  try {
    const {
      gender,
      age,
      reasonForVisit,
      problemStartDate,
      specificTrigger,
      symptomLocation,
      symptomDescription,
      symptomAggravators,
      symptomRelievers,
      severity,
      selectedSymptoms,
      treatmentsAttempted,
      treatmentEffectiveness,
      chronicConditions,
      medicationAllergies,
      pregnancyStatus,
      additionalNotes,
    } = req.body;

    // Create the system prompt for natural French medical language
    const systemPrompt = `You are a medical transcription AI. Generate a natural French HPI confirmation summary that a doctor would say to a patient.

Format requirements:
- Start exactly with: "Juste pour confirmer avec vous avant de continuer; vous êtes un(e) [gender] de [age] ans"
- Continue as a single flowing paragraph with medical details
- Use natural French medical language like: "présentant", "depuis", "localisés", "décrite comme", "aggravée par", "soulagée par", "accompagnée de", "vos antécédents incluent", "allergique à"
- End exactly with: "; Est-ce que ce résumé est exact ?"
- NO bullet points, NO line breaks, NO lists
- One continuous paragraph that flows naturally
- Translate ALL English medical terms to proper French medical terminology
- Use proper French medical grammar and sentence structure

Example format:
"Juste pour confirmer avec vous avant de continuer; vous êtes un homme de 45 ans présentant depuis ce matin une douleur thoracique aiguë, localisée côté gauche, aggravée par la respiration profonde, soulagée par le repos, accompagnée de douleur thoracique et essoufflement; vos antécédents incluent hypertension; allergique à aucune; Est-ce que ce résumé est exact ?"

Patient data: ${JSON.stringify(
      {
        gender,
        age,
        reasonForVisit,
        problemStartDate,
        specificTrigger,
        symptomLocation,
        symptomDescription,
        symptomAggravators,
        symptomRelievers,
        severity,
        selectedSymptoms,
        treatmentsAttempted,
        treatmentEffectiveness,
        chronicConditions,
        medicationAllergies,
        pregnancyStatus,
        additionalNotes,
      },
      null,
      2
    )}`;

    const userMessage = `Generate the HPI confirmation summary using the exact format specified in the system prompt. Translate all English medical terms to proper French medical terminology.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const hpiSummary = response.choices[0]?.message?.content?.trim();

    if (!hpiSummary) {
      throw new Error("Failed to generate HPI summary");
    }

    res.json({
      success: true,
      hpiSummary,
    });
  } catch (error) {
    console.error("Error generating HPI summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate HPI confirmation summary",
    });
  }
});

export default router;
