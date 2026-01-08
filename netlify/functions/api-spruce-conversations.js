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
    console.log("Fetching conversations from Spruce API for messages page...");

    // Fetch conversations from Spruce API
    // Per Spruce API docs: Use Bearer token authentication
    // https://developer.sprucehealth.com/docs/overview#authentication
    const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
        Accept: "application/json",
      },
      params: {
        orderBy: "lastActivity",
        limit: 1000, // Increased limit to get more conversations
        per_page: 1000, // Also try per_page parameter
      },
    });

    console.log(`Received ${response.data.conversations?.length || 0} conversations from Spruce`);

    // Transform conversations for spruce-messages-page format
    const transformedConversations = (response.data.conversations || []).map((conv) => {
      // Extract display name
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

      return {
        id: conv.id,
        patientName: patientName,
        lastMessage: lastMessage,
        lastMessageTime: lastMessageTime,
        unreadCount: conv.unreadCount || 0,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedConversations),
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
