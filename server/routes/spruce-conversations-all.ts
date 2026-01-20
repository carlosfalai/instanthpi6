import { Router } from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { SpruceHealthClient } from "../spruce-health-client";
import { requireAuth, getAuthenticatedUser } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Spruce API configuration
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

// Check if running in local development mode - skip physician DB lookups
const isLocalDev = process.env.NODE_ENV === "development";

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Get all conversations from Spruce API
router.get("/", async (req, res) => {
  try {
    // Get authenticated user's ID for looking up their Spruce credentials
    const user = getAuthenticatedUser(req);
    const doctorId = user?.supabaseId || user?.id?.toString();
    let spruceAccessId: string | null = null;
    let spruceApiKey: string | null = null;

    // Skip physician DB lookup in local dev - use env vars directly
    if (!isLocalDev) {
      const supabase = getSupabase();
      if (supabase && doctorId) {
        // Try to find physician by Supabase user ID
        const { data: physician, error: physicianErr } = await supabase
          .from("physicians")
          .select("spruce_access_id, spruce_api_key")
          .eq("user_id", doctorId)
          .single();

        if (physicianErr && physicianErr.code !== "PGRST205") {
          // Only log errors that aren't "table not found"
          console.error("Supabase physicians read error:", physicianErr);
        }

        spruceAccessId = physician?.spruce_access_id || null;
        spruceApiKey = physician?.spruce_api_key || null;
      }
    }

    // Fallback to headers if provided (direct test without persistence)
    if (!spruceAccessId && req.headers["x-spruce-access-id"]) {
      spruceAccessId = req.headers["x-spruce-access-id"] as string;
    }
    if (!spruceApiKey && req.headers["x-spruce-api-key"]) {
      spruceApiKey = req.headers["x-spruce-api-key"] as string;
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
        message:
          "Please add Spruce Access ID and API Key in Doctor Profile → API Integrations, then try again.",
      });
    }

    const client = new SpruceHealthClient({
      bearerToken: spruceApiKey || spruceAccessId || "",
    });

    console.log("Fetching all conversations from Spruce API with pagination...");

    // Fetch ALL conversations using pagination
    const allConversations: any[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page ${page}...`);
      const conversationsResponse = await client.getConversations({ page, per_page: perPage });
      const conversations = conversationsResponse.conversations || [];

      allConversations.push(...conversations);
      console.log(`Page ${page}: ${conversations.length} conversations (total: ${allConversations.length})`);

      // Check if we got a full page - if less, we're done
      if (conversations.length < perPage) {
        hasMore = false;
      } else {
        page++;
        // Safety limit to prevent infinite loops
        if (page > 50) {
          console.log("Reached page limit (50), stopping pagination");
          hasMore = false;
        }
      }
    }

    console.log(`Total conversations fetched: ${allConversations.length}`);

    // Transform conversations for the frontend
    const transformedConversations = allConversations.map((conv: any) => {
      // Extract patient name from various possible fields
      let patientName = "Unknown Patient";

      if (conv.externalParticipants && conv.externalParticipants.length > 0) {
        const participant = conv.externalParticipants[0];
        patientName =
          participant.displayName || participant.name || participant.contact || "Unknown Patient";
      } else if (conv.title && conv.title !== "Centre Médical Font") {
        patientName = conv.title;
      }

      // Get last message info
      let lastMessage = conv.subtitle || "Click to view conversation";
      let lastMessageTime =
        conv.lastActivity ||
        conv.lastMessageAt ||
        conv.updatedAt ||
        conv.createdAt ||
        new Date().toISOString();

      if (conv.lastMessage) {
        lastMessage = conv.lastMessage.content || lastMessage;
      }

      return {
        id: conv.id,
        patient_name: patientName,
        last_message: lastMessage,
        updated_at: lastMessageTime,
        unread_count: parseInt(String(conv.unreadCount)) || 0,
      };
    });

    // Sort by last activity (most recent first)
    transformedConversations.sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      return timeB - timeA;
    });

    res.json(transformedConversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      error: "Failed to fetch conversations",
      message: error.message,
      details: error.response?.data,
    });
  }
});

export default router;
