import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db";
import { aiDocumentVerifications, patientDocuments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// For xAI (Grok), we'll use a custom API client
// Following similar patterns to OpenAI since xAI/Grok's API structure is similar
class XaiClient {
  private apiKey: string;
  private baseUrl: string = "https://api.x.ai/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCompletion(prompt: string, options: any = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "grok-2-1212",
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.max_tokens || 500,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`XAI API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async analyzeDocument(documentText: string) {
    return this.getCompletion(
      `Please analyze the following medical document and provide a summary of the key findings, any abnormal results, and recommended actions:\n\n${documentText}`
    );
  }
}

const xai = new XaiClient(process.env.XAI_API_KEY || "");

/**
 * Process a document with multiple AI models and compare their interpretations
 */
export async function verifyDocumentWithMultipleModels(
  documentId: number,
  documentText: string
): Promise<{
  verified: boolean;
  consensusSummary: string;
  keyFindings: string;
  confidenceScore: number;
  actionNeeded: boolean;
}> {
  // Start performance timers
  const startTimes = {
    openai: Date.now(),
    anthropic: Date.now(),
    xai: Date.now(),
  };

  // Process with all models in parallel
  const [openaiResult, anthropicResult, xaiResult] = await Promise.all([
    processWithOpenAI(documentText).catch((error) => {
      console.error("OpenAI processing error:", error);
      return null;
    }),
    processWithAnthropic(documentText).catch((error) => {
      console.error("Anthropic processing error:", error);
      return null;
    }),
    processWithXai(documentText).catch((error) => {
      console.error("XAI processing error:", error);
      return null;
    }),
  ]);

  // Calculate processing times
  const processingTimes = {
    openai: openaiResult ? (Date.now() - startTimes.openai) / 1000 : null,
    anthropic: anthropicResult ? (Date.now() - startTimes.anthropic) / 1000 : null,
    xai: xaiResult ? (Date.now() - startTimes.xai) / 1000 : null,
  };

  // Store individual model results
  if (openaiResult) {
    await storeModelVerification(
      documentId,
      "openai",
      "gpt-4o",
      openaiResult,
      processingTimes.openai
    );
  }

  if (anthropicResult) {
    await storeModelVerification(
      documentId,
      "anthropic",
      "claude-3-7-sonnet-20250219",
      anthropicResult,
      processingTimes.anthropic
    );
  }

  if (xaiResult) {
    await storeModelVerification(documentId, "xai", "grok-2-1212", xaiResult, processingTimes.xai);
  }

  // Check if we got results from at least two models
  const validResults = [openaiResult, anthropicResult, xaiResult].filter(Boolean);
  if (validResults.length < 2) {
    throw new Error("Failed to get results from at least two AI models for verification");
  }

  // Compare results and find consensus
  const consensus = compareResults(validResults);

  // Update the document with consensus results
  await db
    .update(patientDocuments)
    .set({
      interpretationSummary: consensus.consensusSummary,
      keyFindings: consensus.keyFindings,
      verificationStatus: consensus.verified ? "verified" : "conflict",
      actionNeeded: consensus.actionNeeded,
      aiProcessedAt: new Date(),
    })
    .where(eq(patientDocuments.id, documentId));

  return consensus;
}

/**
 * Process document with OpenAI
 */
async function processWithOpenAI(documentText: string): Promise<{
  summary: string;
  keyFindings: string;
  confidence: number;
  actionRecommended: boolean;
}> {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a medical document analysis assistant. Analyze the document carefully and extract key medical information. Focus on lab results, diagnoses, recommended actions, and abnormal findings.",
      },
      {
        role: "user",
        content: `Please analyze this medical document and provide a structured response with the following information:
1. Summary: A concise summary of the document's content
2. Key Findings: List the most important medical findings, especially abnormal results
3. Confidence: Your confidence in the interpretation (0.0-1.0)
4. Action Needed: Whether clinical action is needed based on the document (true/false)

Document:
${documentText}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    summary: result.summary || "",
    keyFindings: result.key_findings || "",
    confidence: result.confidence || 0,
    actionRecommended: result.action_needed || false,
  };
}

/**
 * Process document with Anthropic's Claude
 */
async function processWithAnthropic(documentText: string): Promise<{
  summary: string;
  keyFindings: string;
  confidence: number;
  actionRecommended: boolean;
}> {
  // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
  const response = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    system:
      "You are a medical document analysis assistant. Analyze the document carefully and extract key medical information. Focus on lab results, diagnoses, recommended actions, and abnormal findings. Respond in JSON format.",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Please analyze this medical document and provide a structured response with the following information:
1. Summary: A concise summary of the document's content
2. Key Findings: List the most important medical findings, especially abnormal results
3. Confidence: Your confidence in the interpretation (0.0-1.0)
4. Action Needed: Whether clinical action is needed based on the document (true/false)

Document:
${documentText}`,
      },
    ],
  });

  // Parse the JSON from Claude's response
  const firstBlock = response.content[0];
  const responseText = firstBlock.type === 'text' ? firstBlock.text : '';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    const result = JSON.parse(jsonText);

    return {
      summary: result.summary || "",
      keyFindings: result.key_findings || "",
      confidence: result.confidence || 0,
      actionRecommended: result.action_needed || false,
    };
  } catch (error) {
    console.error("Error parsing Anthropic response:", error);

    // Fallback parsing if JSON extraction fails
    return {
      summary: extractSection(responseText, "Summary:"),
      keyFindings: extractSection(responseText, "Key Findings:"),
      confidence: extractConfidence(responseText),
      actionRecommended: responseText.toLowerCase().includes("action needed: true"),
    };
  }
}

/**
 * Process document with xAI's Grok
 */
async function processWithXai(documentText: string): Promise<{
  summary: string;
  keyFindings: string;
  confidence: number;
  actionRecommended: boolean;
}> {
  const response = await xai.getCompletion(
    `Please analyze this medical document and provide a structured response with the following information:
1. Summary: A concise summary of the document's content
2. Key Findings: List the most important medical findings, especially abnormal results
3. Confidence: Your confidence in the interpretation (0.0-1.0)
4. Action Needed: Whether clinical action is needed based on the document (true/false)

Document:
${documentText}`,
    { model: "grok-2-1212" }
  );

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      summary: result.summary || "",
      keyFindings: result.key_findings || "",
      confidence: result.confidence || 0,
      actionRecommended: result.action_needed || false,
    };
  } catch (error) {
    console.error("Error parsing xAI response:", error);

    // Fallback parsing if JSON extraction fails
    const text = response.choices[0].message.content;
    return {
      summary: extractSection(text, "Summary:"),
      keyFindings: extractSection(text, "Key Findings:"),
      confidence: extractConfidence(text),
      actionRecommended: text.toLowerCase().includes("action needed: true"),
    };
  }
}

/**
 * Store model verification results in the database
 */
async function storeModelVerification(
  documentId: number,
  modelName: string,
  modelVersion: string,
  result: any,
  processingTime: number | null
) {
  await db.insert(aiDocumentVerifications).values({
    documentId,
    modelName,
    modelVersion,
    interpretationSummary: result.summary,
    keyFindings: result.keyFindings,
    confidenceScore: result.confidence,
    actionRecommended: result.actionRecommended,
    processingTime: processingTime || 0,
  });
}

/**
 * Compare results from multiple models and determine consensus
 */
function compareResults(results: any[]): {
  verified: boolean;
  consensusSummary: string;
  keyFindings: string;
  confidenceScore: number;
  actionNeeded: boolean;
} {
  // Use the model with highest confidence as primary source
  results.sort((a, b) => b.confidence - a.confidence);
  const primaryResult = results[0];

  // Check if action recommendations are consistent
  const actionConsensus = results.every(
    (r) => r.actionRecommended === primaryResult.actionRecommended
  );

  // Check similarity of key findings (simple implementation - in production would use more sophisticated NLP)
  let findingsConsensus = true;
  for (let i = 1; i < results.length; i++) {
    const similarity = calculateTextSimilarity(primaryResult.keyFindings, results[i].keyFindings);
    if (similarity < 0.7) {
      // Threshold for consensus
      findingsConsensus = false;
      break;
    }
  }

  // Calculate average confidence
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  return {
    verified: actionConsensus && findingsConsensus && avgConfidence > 0.8,
    consensusSummary: primaryResult.summary,
    keyFindings: primaryResult.keyFindings,
    confidenceScore: avgConfidence,
    actionNeeded: primaryResult.actionRecommended,
  };
}

/**
 * Calculate text similarity (simple implementation)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  // This is a very basic implementation - in production would use proper NLP methods
  const words1 = new Set(
    text1
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Helper to extract sections from text when JSON parsing fails
 */
function extractSection(text: string, sectionHeader: string): string {
  const regex = new RegExp(`${sectionHeader}([\\s\\S]*?)(?=\\d+\\.\\s|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Helper to extract confidence score from text
 */
function extractConfidence(text: string): number {
  const regex = /confidence:\s*(0\.\d+|1\.0|1)/i;
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : 0.5;
}
