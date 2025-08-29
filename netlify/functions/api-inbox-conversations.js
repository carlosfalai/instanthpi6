const axios = require("axios");

// Spruce API configuration
const SPRUCE_BEARER_TOKEN =
  process.env.SPRUCE_BEARER_TOKEN ||
  "YWlkX0x4WEZaNXBCYktwTU1KbjA3a0hHU2Q0d0UrST06c2tfVkNxZGxFWWNtSHFhcjN1TGs3NkZQa2ZoWm9JSEsyVy80bTVJRUpSQWhCY25lSEpPV3hqd2JBPT0=";
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

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

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("Fetching conversations from Spruce API...");

    // Fetch conversations from Spruce API
    const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
        Accept: "application/json",
      },
      params: {
        orderBy: "lastActivity",
        limit: 200,
      },
    });

    console.log(`Received ${response.data.conversations?.length || 0} conversations from Spruce`);

    // Transform the conversations for the inbox format
    const conversations = (response.data.conversations || []).map((conv) => {
      // Extract display name
      let displayName = "Unknown";
      if (conv.externalParticipants && conv.externalParticipants.length > 0) {
        displayName = conv.externalParticipants[0].displayName || "Unknown";
      } else if (conv.title) {
        displayName = conv.title;
      }

      return {
        id: conv.id,
        entityId: conv.id,
        displayName: displayName,
        lastActivity: conv.lastActivity || conv.createdAt,
        unreadCount: conv.unreadCount || 0,
        type: conv.type || "conversation",
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(conversations),
    };
  } catch (error) {
    console.error("Error fetching conversations:", error.response?.data || error.message);

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch conversations",
        message: error.message,
        details: error.response?.data,
      }),
    };
  }
};
