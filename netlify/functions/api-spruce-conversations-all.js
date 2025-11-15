const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// Spruce API configuration
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Spruce-Access-Id, X-Spruce-Api-Key",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // 1) Load doctor credentials (currently using default doctor id)
    const doctorId = "default-doctor";
    let spruceAccessId = null;
    let spruceApiKey = null;

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

      spruceAccessId = physician?.spruce_access_id;
      spruceApiKey = physician?.spruce_api_key;
    }

    // Fallback to headers if provided (direct test without persistence)
    if (!spruceAccessId && (event.headers["x-spruce-access-id"] || event.headers["X-Spruce-Access-Id"])) {
      spruceAccessId = event.headers["x-spruce-access-id"] || event.headers["X-Spruce-Access-Id"]; 
    }
    if (!spruceApiKey && (event.headers["x-spruce-api-key"] || event.headers["X-Spruce-Api-Key"])) {
      spruceApiKey = event.headers["x-spruce-api-key"] || event.headers["X-Spruce-Api-Key"]; 
    }

    if (!spruceAccessId || !spruceApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Spruce credentials not configured",
          message: "Please add Spruce Access ID and API Key in Doctor Profile → API Integrations, then try again.",
        }),
      };
    }

    console.log("Fetching ALL conversations from Spruce API with pagination...");

    let allConversations = [];
    let paginationToken = null;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 10; // Safety limit to prevent infinite loops

    // Keep fetching pages until we have all conversations
    while (hasMore && pageCount < maxPages) {
      const params = {
        orderBy: "lastActivity",
        limit: 200,
      };

      // Add pagination token if we have one
      if (paginationToken) {
        params.paginationToken = paginationToken;
      }

      // Build Basic auth token from aid:api_key per Spruce API
      const basicToken = /^YWlk/.test(spruceApiKey)
        ? spruceApiKey
        : Buffer.from(`${spruceAccessId}:${spruceApiKey}`).toString("base64");
      const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
        headers: {
          Authorization: `Basic ${basicToken}`,
          Accept: "application/json",
        },
        params,
      });

      const conversations = response.data.conversations || [];
      allConversations = allConversations.concat(conversations);

      // Check if there are more pages
      hasMore = response.data.hasMore || false;
      paginationToken = response.data.paginationToken;
      pageCount++;

      console.log(
        `Page ${pageCount}: fetched ${conversations.length} conversations. Total so far: ${allConversations.length}`
      );

      // Break if no pagination token even though hasMore is true
      if (hasMore && !paginationToken) {
        console.log("Has more conversations but no pagination token provided");
        break;
      }
    }

    console.log(
      `Fetched total of ${allConversations.length} conversations across ${pageCount} pages`
    );

    // Transform conversations for the frontend
    const transformedConversations = allConversations.map((conv) => {
      // Extract patient name from various possible fields
      let patientName = "Unknown Patient";

      if (conv.externalParticipants && conv.externalParticipants.length > 0) {
        patientName = conv.externalParticipants[0].displayName || "Unknown Patient";
      } else if (conv.title) {
        patientName = conv.title;
      }

      // Get last message info
      let lastMessage = "Click to view conversation";
      let lastMessageTime = conv.lastActivity || conv.createdAt || new Date().toISOString();

      if (conv.lastMessage) {
        lastMessage = conv.lastMessage.content || conv.lastMessage.text || lastMessage;
        lastMessageTime = conv.lastMessage.timestamp || lastMessageTime;
      }

      // Align field names with frontend expectations (doctor-dashboard-new.tsx):
      // patient_name, last_message, updated_at
      return {
        id: conv.id,
        patient_name: patientName,
        last_message: lastMessage,
        updated_at: lastMessageTime,
        unread_count: conv.unreadCount || 0,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedConversations),
    };
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    const errorStatus = error.response?.status || 500;
    const errorDetails = error.response?.data;
    
    console.error("Error fetching conversations:", {
      message: errorMessage,
      status: errorStatus,
      details: errorDetails,
      timestamp: new Date().toISOString()
    });

    // Return user-safe error message (don't expose internal details)
    return {
      statusCode: errorStatus,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch conversations",
        message: errorStatus === 401 ? "Authentication failed. Please check your Spruce API credentials." :
                 errorStatus === 403 ? "Access denied. Please verify your Spruce API permissions." :
                 errorStatus === 429 ? "Rate limit exceeded. Please try again later." :
                 "Please try again later or contact support if the problem persists.",
        timestamp: new Date().toISOString()
      }),
    };
  }
};
