import { Router } from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

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
router.get("/history/:conversationId", async (req, res) => {
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

    console.log(`Fetching messages for conversation ${conversationId}...`);

    // Build Basic auth token
    const basicToken = /^YWlk/.test(spruceApiKey)
      ? spruceApiKey
      : Buffer.from(`${spruceAccessId}:${spruceApiKey}`).toString("base64");

    // Fetch messages from Spruce API
    const response = await axios.get(`${SPRUCE_API_URL}/conversations/${conversationId}/messages`, {
      headers: {
        Authorization: `Basic ${basicToken}`,
        Accept: "application/json",
      },
      params: {
        per_page: 100,
        sort: "desc",
      },
    });

    const messages = response.data.messages || response.data.data || [];

    // Transform messages for frontend format
    const transformedMessages = messages.map((msg: any) => ({
      id: msg.id || msg.message_id,
      content: msg.content || msg.body || msg.text || "",
      timestamp: msg.sent_at || msg.created_at || msg.timestamp || new Date().toISOString(),
      isFromPatient: !msg.from_organization && !msg.from_team && !msg.is_from_clinic,
      sender: msg.sender_name || msg.from_name || (msg.is_from_patient ? "Patient" : "Doctor"),
    }));

    // Return in expected format
    res.json({ messages: transformedMessages });
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

