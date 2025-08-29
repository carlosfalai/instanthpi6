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

  // Extract conversation ID from path
  const pathParts = event.path.split("/");
  const conversationId = pathParts[pathParts.length - 1];

  if (!conversationId || conversationId === "api-spruce-conversations-[id]") {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Conversation ID is required" }),
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
    console.log(`Fetching messages for conversation ${conversationId}...`);

    // Try to fetch messages for the conversation
    let messages = [];

    try {
      // Try the messages endpoint
      const messagesResponse = await axios.get(
        `${SPRUCE_API_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
            Accept: "application/json",
          },
          params: {
            per_page: 50,
            sort: "desc",
          },
        }
      );

      messages = messagesResponse.data.messages || messagesResponse.data || [];
      console.log(`Found ${messages.length} messages`);
    } catch (error) {
      console.log("Messages endpoint failed, trying conversation details...");

      // Try to get conversation details as fallback
      try {
        const convResponse = await axios.get(`${SPRUCE_API_URL}/conversations/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
            Accept: "application/json",
          },
        });

        const conversation = convResponse.data.conversation || convResponse.data;
        messages = conversation.messages || conversation.recent_messages || [];
        console.log(`Found ${messages.length} messages in conversation details`);
      } catch (convError) {
        console.error("Failed to fetch conversation details:", convError.message);
        messages = [];
      }
    }

    // Transform messages for the frontend format
    const transformedMessages = messages.map((msg) => ({
      id: msg.id || `msg_${Date.now()}_${Math.random()}`,
      content: msg.content || msg.text || msg.body || "",
      timestamp: msg.sent_at || msg.created_at || msg.timestamp || new Date().toISOString(),
      isFromPatient:
        msg.sender_type === "external" ||
        (msg.sender_id !== "doctor" && msg.sender_name !== "Doctor"),
      senderName: msg.sender_name || (msg.sender_type === "external" ? "Patient" : "Doctor"),
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedMessages),
    };
  } catch (error) {
    console.error("Error fetching messages:", error.response?.data || error.message);

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch messages",
        message: error.message,
        details: error.response?.data,
      }),
    };
  }
};
