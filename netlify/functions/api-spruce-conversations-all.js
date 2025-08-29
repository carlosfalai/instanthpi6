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

      const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
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
