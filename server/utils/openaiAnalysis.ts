import OpenAI from "openai";
import { PendingItem } from "@shared/schema";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyzes patient conversation history to identify pending medical items
 * @param patientId The ID of the patient
 * @param messages Array of messages from the conversation
 * @returns Array of identified pending items
 */
export async function analyzePendingItems(
  patientId: number,
  messages: any[]
): Promise<PendingItem[]> {
  // Sort messages by timestamp to ensure chronological order
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Create conversation history for analysis
  const conversationHistory = sortedMessages.map((msg) => ({
    role: msg.isFromPatient ? "patient" : "doctor",
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  try {
    // Call OpenAI to analyze the conversation
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that helps identify pending medical items in patient-doctor conversations.
          Analyze the conversation to find tests, imaging, referrals, bloodwork, or other medical tasks that were ordered
          but have not been completed or followed up on. Pay attention to items that the doctor ordered or mentioned, but
          that don't have clear resolution in the conversation. For each pending item, determine its type, description,
          requested date (if available), and priority (high/medium/low).
          
          Respond with a JSON array of pending items in this format:
          [
            {
              "id": "generate a unique string ID",
              "type": "test", // one of: test, imaging, bloodwork, referral, other
              "description": "detailed description of the pending item",
              "requestedDate": "YYYY-MM-DD", // date when it was requested, if available
              "priority": "high", // one of: high, medium, low
              "status": "pending",
              "patientId": ${patientId}
            }
          ]
          
          If no pending items are found, respond with an empty array [].`,
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role === "doctor" ? ("assistant" as const) : ("user" as const),
          content: `[${msg.role.toUpperCase()}] ${msg.timestamp}: ${msg.content}`,
        })),
      ],
      response_format: { type: "json_object" },
    });

    // Parse and return the results
    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Return the pending items array, or an empty array if none were found
    return result.pendingItems || result || [];
  } catch (error) {
    console.error("Error analyzing pending items:", error);
    return [];
  }
}
