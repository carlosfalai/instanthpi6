const crypto = require("crypto");

// Store for real-time message updates (in production, use a database or Redis)
const messageUpdates = new Map();

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.SPRUCE_WEBHOOK_SECRET || "gcrXGxhgg8FP6TSGSYyskN5dm";

// Verify Spruce webhook signature
function verifySpruceSignature(payload, signature, secret) {
  if (!secret) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("base64");

  return calculatedSignature === signature;
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Verify signature if secret is configured
    const signature = event.headers["x-spruce-signature"];
    const payload = event.body;

    if (WEBHOOK_SECRET && signature) {
      if (!verifySpruceSignature(payload, signature, WEBHOOK_SECRET)) {
        console.error("Invalid webhook signature");
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid signature" }),
        };
      }
    }

    const body = JSON.parse(event.body);
    const { event: eventType, data } = body;

    console.log("Received Spruce webhook event:", eventType);
    console.log("Event data:", JSON.stringify(data));

    // Handle different event types according to Spruce documentation
    if (eventType === "conversationItem.created") {
      // This is a new message in a conversation
      console.log("New message received:", data);

      // In a real production app, you would:
      // 1. Store this in a database
      // 2. Send real-time updates via WebSocket
      // 3. Trigger notifications
    } else if (eventType === "conversation.updated") {
      // Handle conversation updates (like unread count changes)
      console.log("Conversation updated:", data);
    } else if (eventType === "conversation.created") {
      // Handle new conversation
      console.log("New conversation created:", data);
    }

    // Acknowledge receipt with 200 status (required by Spruce)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ received: true, event: eventType }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return 500 to trigger retry from Spruce
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process webhook" }),
    };
  }
};
