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
    "Access-Control-Allow-Headers": "Content-Type",
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

  // Extract conversation ID from path
  // Path format: /api/spruce/conversations/{id}/history
  const pathParts = event.path.split("/").filter((p) => p);
  let conversationId = null;

  // Find the conversation ID (should be before "history")
  const historyIndex = pathParts.indexOf("history");
  if (historyIndex > 0) {
    conversationId = pathParts[historyIndex - 1];
  } else {
    // Fallback: try last part if no "history" found
    conversationId = pathParts[pathParts.length - 1];
  }

  if (!conversationId || conversationId === "history" || conversationId === "conversations") {
    console.error("Invalid conversation ID from path:", event.path, "parts:", pathParts);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Conversation ID is required",
        path: event.path,
        parts: pathParts,
      }),
    };
  }

  try {
    console.log(`Fetching message history for conversation ${conversationId}...`);

    // 1) Load doctor credentials from Supabase
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

    // Fallback to headers if provided
    if (
      !spruceAccessId &&
      (event.headers["x-spruce-access-id"] || event.headers["X-Spruce-Access-Id"])
    ) {
      spruceAccessId = event.headers["x-spruce-access-id"] || event.headers["X-Spruce-Access-Id"];
    }
    if (!spruceApiKey && (event.headers["x-spruce-api-key"] || event.headers["X-Spruce-Api-Key"])) {
      spruceApiKey = event.headers["x-spruce-api-key"] || event.headers["X-Spruce-Api-Key"];
    }

    // Fallback to environment variables (global config)
    if (!spruceAccessId && process.env.SPRUCE_ACCESS_ID) {
      spruceAccessId = process.env.SPRUCE_ACCESS_ID;
    }
    if (!spruceApiKey && process.env.SPRUCE_API_KEY) {
      spruceApiKey = process.env.SPRUCE_API_KEY;
    }
    // Also check SPRUCE_BEARER_TOKEN as alternative
    if (!spruceApiKey && process.env.SPRUCE_BEARER_TOKEN) {
      spruceApiKey = process.env.SPRUCE_BEARER_TOKEN;
    }

    if (!spruceAccessId || !spruceApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Spruce credentials not configured",
          message:
            "Please add Spruce Access ID and API Key in Doctor Profile → API Integrations, then try again.",
        }),
      };
    }

    // Use Bearer token authentication per Spruce API documentation
    const bearerToken = spruceApiKey;

    // Fetch conversation details from Spruce API
    // Note: Spruce API doesn't have a direct endpoint to list all messages in a conversation
    // Messages are typically received via webhooks. We fetch conversation metadata instead.
    console.log(`Calling Spruce API: ${SPRUCE_API_URL}/conversations/${conversationId}`);

    const conversationResponse = await axios.get(
      `${SPRUCE_API_URL}/conversations/${conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          Accept: "application/json",
        },
      }
    );

    console.log(`Spruce API response status: ${conversationResponse.status}`);
    console.log(
      `Spruce API response keys: ${Object.keys(conversationResponse.data || {}).join(", ")}`
    );

    const conversation = conversationResponse.data;
    console.log(`Conversation details:`, JSON.stringify(conversation).substring(0, 500));

    // Extract any available message content from the conversation
    let spruceMessages = [];

    // Check if conversation has items/messages included
    if (conversation.items && Array.isArray(conversation.items)) {
      spruceMessages = conversation.items;
    } else if (conversation.messages && Array.isArray(conversation.messages)) {
      spruceMessages = conversation.messages;
    } else if (conversation.conversationItems && Array.isArray(conversation.conversationItems)) {
      spruceMessages = conversation.conversationItems;
    }

    console.log(`Found ${spruceMessages.length} items in conversation`);

    // Transform Spruce messages to inbox format
    const transformedMessages = (Array.isArray(spruceMessages) ? spruceMessages : [])
      .map((msg) => {
        // Determine if message is from patient (external participant)
        const isFromPatient =
          msg.actor?.type === "external" ||
          msg.actor?.isExternal === true ||
          msg.sender?.type === "external" ||
          msg.sender?.isExternal === true ||
          (!msg.actor?.isInternal && !msg.sender?.isInternal);

        // Get message content - can be in different fields depending on item type
        let content = "";
        if (msg.message) {
          content = msg.message.text || msg.message.content || msg.message.body || "";
        } else {
          content = msg.content || msg.text || msg.body || msg.summary || "";
        }

        return {
          id: msg.id || msg.messageId || msg.conversationItemId,
          content: content,
          timestamp:
            msg.timestamp ||
            msg.createdAt ||
            msg.sentAt ||
            msg.occurredAt ||
            new Date().toISOString(),
          isFromPatient: isFromPatient,
          senderName:
            msg.actor?.displayName ||
            msg.actor?.name ||
            msg.sender?.displayName ||
            msg.sender?.name ||
            (isFromPatient ? "Patient" : "Dr. Font"),
          type: msg.type || "message",
        };
      })
      .filter((msg) => msg.content); // Only include messages with content

    // Sort by timestamp (oldest first)
    transformedMessages.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    console.log(
      `Returning ${transformedMessages.length} transformed messages for conversation ${conversationId}`
    );

    // If no messages found, return helpful info about the conversation
    if (transformedMessages.length === 0) {
      // Include conversation metadata so frontend can show patient info
      const lastActivity =
        conversation.lastActivity || conversation.updatedAt || conversation.createdAt;
      const subtitle = conversation.subtitle || conversation.lastMessage?.content || "";

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          messages: [],
          conversationInfo: {
            id: conversation.id,
            title: conversation.title,
            lastActivity: lastActivity,
            subtitle: subtitle,
            note: "Message history is managed through Spruce. View the full conversation in the Spruce app.",
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedMessages),
    };
  } catch (error) {
    const errorStatus = error.response?.status || 500;
    const errorData = error.response?.data;

    console.error("Error fetching message history:", {
      status: errorStatus,
      data: errorData,
      message: error.message,
    });

    // Return the actual error - no fake data
    return {
      statusCode: errorStatus,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch message history",
        message:
          errorStatus === 401
            ? "Authentication failed. Please check your Spruce API credentials."
            : errorStatus === 403
              ? "Access denied. Please verify your Spruce API permissions."
              : errorStatus === 404
                ? "Conversation not found or no messages available."
                : error.message || "Unknown error",
        conversationId: conversationId,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
