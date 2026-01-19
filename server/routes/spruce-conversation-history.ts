import { Router } from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { SpruceHealthClient } from "../spruce-health-client";

const router = Router();

// Spruce API configuration
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Get conversation history/messages
// Supports both routes: /:conversationId/history and /history/:conversationId
router.get("/:conversationId/history", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    // Load doctor credentials
    const doctorId = "default-doctor";
    let spruceAccessId: string | null = null;
    let spruceApiKey: string | null = null;

    const supabase = getSupabase();
    if (supabase) {
      const { data: physician, error: physicianErr } = await supabase
        .from("physicians")
        .select("spruce_access_id, spruce_api_key")
        .eq("id", doctorId)
        .single();

      if (physicianErr) {
        console.error("Supabase physicians read error:", physicianErr);
      }

      spruceAccessId = physician?.spruce_access_id || null;
      spruceApiKey = physician?.spruce_api_key || null;
    }

    // Fallback to environment variables
    if (!spruceAccessId) {
      spruceAccessId = process.env.SPRUCE_ACCESS_ID || null;
    }
    if (!spruceApiKey) {
      spruceApiKey = process.env.SPRUCE_API_KEY || null;
    }

    if (!spruceAccessId || !spruceApiKey) {
      return res.status(400).json({
        error: "Spruce credentials not configured",
        message: "Please add Spruce Access ID and API Key in Doctor Profile → API Integrations.",
      });
    }

    const client = new SpruceHealthClient({
      bearerToken: spruceApiKey || spruceAccessId || ""
    });

    console.log(`Fetching messages for conversation ${conversationId}...`);
    const messagesResponse = await client.getMessages(conversationId, { per_page: 100 });
    const messages = messagesResponse.messages || [];

    // Return in expected format
    res.json(messages);
  } catch (error: any) {
    console.error("Error fetching conversation history:", error.response?.data || error.message);

    // If no messages found, return empty array instead of error
    if (error.response?.status === 404) {
      return res.json({ messages: [] });
    }

    res.status(error.response?.status || 500).json({
      error: "Failed to fetch conversation history",
      message: error.message,
      details: error.response?.data,
    });
  }
});

export default router;

