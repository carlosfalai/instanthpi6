import express from "express";
import * as anthropicUtils from "../utils/anthropic";

export const router = express.Router();

/**
 * Generate text with Claude
 * POST /api/anthropic/generate-text
 */
router.post("/generate-text", async (req, res) => {
  try {
    const { prompt, model, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const result = await anthropicUtils.generateText(prompt, model, maxTokens);

    res.json({ result });
  } catch (error: any) {
    console.error("Error in generate-text endpoint:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

/**
 * Summarize text with Claude
 * POST /api/anthropic/summarize-text
 */
router.post("/summarize-text", async (req, res) => {
  try {
    const { text, wordLimit, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const result = await anthropicUtils.summarizeText(text, wordLimit, model);

    res.json({ result });
  } catch (error: any) {
    console.error("Error in summarize-text endpoint:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

/**
 * Analyze sentiment with Claude
 * POST /api/anthropic/analyze-sentiment
 */
router.post("/analyze-sentiment", async (req, res) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const result = await anthropicUtils.analyzeSentiment(text, model);

    res.json({ result });
  } catch (error: any) {
    console.error("Error in analyze-sentiment endpoint:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

/**
 * Analyze image with Claude Vision
 * POST /api/anthropic/analyze-image
 */
router.post("/analyze-image", async (req, res) => {
  try {
    const { imageBase64, prompt, model } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const result = await anthropicUtils.analyzeImage(imageBase64, prompt, model);

    res.json({ result });
  } catch (error: any) {
    console.error("Error in analyze-image endpoint:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

/**
 * Generate medical documentation with Claude
 * POST /api/anthropic/generate-medical-documentation
 */
router.post("/generate-medical-documentation", async (req, res) => {
  try {
    const { patientData, options, model } = req.body;

    if (!patientData) {
      return res.status(400).json({ error: "Patient data is required" });
    }

    const result = await anthropicUtils.generateMedicalDocumentation(patientData, options, model);

    res.json({ result });
  } catch (error: any) {
    console.error("Error in generate-medical-documentation endpoint:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

/**
 * Generate treatment plan with Claude
 * POST /api/anthropic/generate-treatment-plan
 */
router.post("/generate-treatment-plan", async (req, res) => {
  try {
    const { diagnosis, patientDetails, model } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ error: "Diagnosis is required" });
    }

    const result = await anthropicUtils.generateTreatmentPlan(diagnosis, patientDetails, model);

    res.json({ result });
  } catch (error: any) {
    console.error("Error in generate-treatment-plan endpoint:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});
