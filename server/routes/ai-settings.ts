import { Router } from "express";
import { db } from "../db";
import { aiSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAvailableModels } from "../utils/aiClient";

const router = Router();

// GET /api/ai-settings/:userId - Get AI settings for a user
router.get("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const settings = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        userId,
        preferredAiProvider: "openai",
        openaiModel: "gpt-4o",
        claudeModel: "claude-3-5-haiku-20241022",
        openaiApiKey: null, // Don't return the actual key for security
        claudeApiKey: null, // Don't return the actual key for security
        hasOpenaiKey: false,
        hasClaudeKey: false,
        availableModels: getAvailableModels(),
        // All other settings default to true
        hpiConfirmationEnabled: true,
        differentialDiagnosisEnabled: true,
        followUpQuestionsEnabled: true,
        preventativeCareEnabled: true,
        labworkSuggestionsEnabled: true,
        inPersonReferralEnabled: true,
        prescriptionSuggestionsEnabled: true,
        medicalNotesDraftEnabled: true,
        pendingItemsTrackingEnabled: true,
        billingOptimizationEnabled: true,
        functionalMedicineEnabled: false,
      });
    }

    const userSettings = settings[0];
    
    res.json({
      ...userSettings,
      openaiApiKey: null, // Don't return the actual key for security
      claudeApiKey: null, // Don't return the actual key for security
      hasOpenaiKey: !!userSettings.openaiApiKey,
      hasClaudeKey: !!userSettings.claudeApiKey,
      availableModels: getAvailableModels(),
    });
  } catch (error: any) {
    console.error("Error getting AI settings:", error);
    res.status(500).json({ error: "Failed to get AI settings" });
  }
});

// PUT /api/ai-settings/:userId - Update AI settings for a user
router.put("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const {
      preferredAiProvider,
      openaiApiKey,
      claudeApiKey,
      openaiModel,
      claudeModel,
      hpiConfirmationEnabled,
      differentialDiagnosisEnabled,
      followUpQuestionsEnabled,
      preventativeCareEnabled,
      labworkSuggestionsEnabled,
      inPersonReferralEnabled,
      prescriptionSuggestionsEnabled,
      medicalNotesDraftEnabled,
      pendingItemsTrackingEnabled,
      billingOptimizationEnabled,
      functionalMedicineEnabled,
    } = req.body;

    // Validate provider
    if (preferredAiProvider && !['openai', 'claude'].includes(preferredAiProvider)) {
      return res.status(400).json({ error: "Invalid AI provider. Must be 'openai' or 'claude'" });
    }

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, userId))
      .limit(1);

    const updateData = {
      userId,
      preferredAiProvider,
      openaiApiKey,
      claudeApiKey,
      openaiModel,
      claudeModel,
      hpiConfirmationEnabled,
      differentialDiagnosisEnabled,
      followUpQuestionsEnabled,
      preventativeCareEnabled,
      labworkSuggestionsEnabled,
      inPersonReferralEnabled,
      prescriptionSuggestionsEnabled,
      medicalNotesDraftEnabled,
      pendingItemsTrackingEnabled,
      billingOptimizationEnabled,
      functionalMedicineEnabled,
      updatedAt: new Date(),
    };

    if (existingSettings.length === 0) {
      // Create new settings
      await db.insert(aiSettings).values(updateData);
    } else {
      // Update existing settings
      await db
        .update(aiSettings)
        .set(updateData)
        .where(eq(aiSettings.userId, userId));
    }

    res.json({ 
      success: true, 
      message: "AI settings updated successfully",
      // Don't return the actual API keys
      updatedSettings: {
        ...updateData,
        openaiApiKey: null,
        claudeApiKey: null,
        hasOpenaiKey: !!openaiApiKey,
        hasClaudeKey: !!claudeApiKey,
      }
    });
  } catch (error: any) {
    console.error("Error updating AI settings:", error);
    res.status(500).json({ error: "Failed to update AI settings" });
  }
});

// POST /api/ai-settings/:userId/test - Test AI configuration
router.post("/:userId/test", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { createUserAIClient } = await import("../utils/aiClient");
    const aiClient = await createUserAIClient(userId);

    if (!aiClient) {
      return res.status(400).json({ 
        error: "No AI configuration found. Please configure your API keys first." 
      });
    }

    // Test the AI client
    const testResponse = await aiClient.generateCompletion([
      { role: "user", content: "Hello, please respond with 'AI connection successful' to confirm everything is working." }
    ], "You are a helpful medical AI assistant. Respond briefly to confirm the connection.");

    res.json({
      success: true,
      provider: aiClient.provider,
      model: aiClient.model,
      testResponse: testResponse.substring(0, 200), // Limit response length
      message: "AI configuration test successful"
    });
  } catch (error: any) {
    console.error("Error testing AI configuration:", error);
    res.status(500).json({ 
      error: "AI configuration test failed", 
      details: error.message 
    });
  }
});

export default router;
