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
    const maxPages = 50; // Increased limit to fetch more conversations (old and new)
    const maxConversations = 10000; // Absolute maximum to prevent excessive memory usage

    // Keep fetching pages until we have all conversations
    while (hasMore && pageCount < maxPages && allConversations.length < maxConversations) {
      const params = {
        orderBy: "lastActivity",
        limit: 200, // Max per page per Spruce API
      };

      // Add pagination token if we have one
      if (paginationToken) {
        params.paginationToken = paginationToken;
      }

      // Build Basic auth token from aid:api_key per Spruce API
      const basicToken = /^YWlk/.test(spruceApiKey)
        ? spruceApiKey
        : Buffer.from(`${spruceAccessId}:${spruceApiKey}`).toString("base64");
      
      try {
        const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
          headers: {
            Authorization: `Basic ${basicToken}`,
            Accept: "application/json",
          },
          params,
        });

        const conversations = response.data.conversations || [];
        
        // Avoid duplicates by checking conversation IDs
        const existingIds = new Set(allConversations.map(c => c.id));
        const newConversations = conversations.filter(c => !existingIds.has(c.id));
        
        allConversations = allConversations.concat(newConversations);

        // Check if there are more pages
        hasMore = response.data.hasMore || false;
        paginationToken = response.data.paginationToken || response.data.nextPageToken;
        pageCount++;

        console.log(
          `Page ${pageCount}: fetched ${conversations.length} conversations (${newConversations.length} new). Total: ${allConversations.length}`
        );

        // Break if no pagination token even though hasMore is true
        if (hasMore && !paginationToken) {
          console.log("⚠️ Has more conversations but no pagination token provided - stopping pagination");
          break;
        }

        // Break if we got fewer conversations than requested (likely last page)
        if (conversations.length < 200) {
          console.log(`Reached last page (got ${conversations.length} conversations)`);
          break;
        }
      } catch (pageError) {
        console.error(`Error fetching page ${pageCount + 1}:`, pageError.response?.data || pageError.message);
        // Continue with what we have if we've already fetched some conversations
        if (allConversations.length > 0) {
          console.log(`Continuing with ${allConversations.length} conversations already fetched`);
          break;
        }
        throw pageError;
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
        const participant = conv.externalParticipants[0];
        patientName = participant.displayName || participant.name || participant.contact || "Unknown Patient";
      } else if (conv.title && conv.title !== "Centre Médical Font") {
        patientName = conv.title;
      } else if (conv.participants && conv.participants.length > 0) {
        patientName = conv.participants[0].displayName || conv.participants[0].name || "Unknown Patient";
      }

      // Get last message info - check multiple possible fields
      let lastMessage = "Click to view conversation";
      let lastMessageTime = conv.lastActivity || conv.lastMessageAt || conv.updatedAt || conv.createdAt || new Date().toISOString();

      if (conv.lastMessage) {
        lastMessage = conv.lastMessage.content || conv.lastMessage.text || conv.lastMessage.body || lastMessage;
        lastMessageTime = conv.lastMessage.timestamp || conv.lastMessage.createdAt || lastMessageTime;
      } else if (conv.subtitle) {
        lastMessage = conv.subtitle;
      }

      // Align field names with frontend expectations (doctor-dashboard-new.tsx):
      // patient_name, last_message, updated_at
      return {
        id: conv.id,
        patient_name: patientName,
        last_message: lastMessage,
        updated_at: lastMessageTime,
        unread_count: conv.unreadCount || conv.unread_count || 0,
        // Include additional fields that might be useful
        title: conv.title,
        createdAt: conv.createdAt,
        lastActivity: conv.lastActivity,
      };
    });

    // Sort by last activity (most recent first)
    transformedConversations.sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      return timeB - timeA;
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
