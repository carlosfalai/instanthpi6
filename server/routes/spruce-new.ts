import { Router } from "express";
import { SpruceHealthClient } from "../spruce-health-client";

// Initialize Spruce Health client - USER-SPECIFIC (NO SHARED CREDENTIALS)
// Each doctor must provide their own Spruce credentials
const createUserSpruceClient = (bearerToken: string) => {
  if (!bearerToken) {
    throw new Error("Spruce bearer token not provided for this user");
  }

  return new SpruceHealthClient({
    bearerToken: bearerToken,
    maxRetries: 3,
    retryDelay: 1000,
  });
};

// Helper function to get user-specific Spruce client
const getUserSpruceClient = () => {
  // TODO: Get from authenticated user's profile instead of environment
  // For now, using environment variables as fallback
  const bearerToken = process.env.SPRUCE_BEARER_TOKEN || "";

  if (!bearerToken) {
    console.warn("⚠️ WARNING: No Spruce bearer token found for this user.");
    throw new Error("Spruce API credentials not configured for this user");
  }

  return createUserSpruceClient(bearerToken);
};

export const router = Router();

// Get conversations for inbox
router.get("/conversations", async (req, res) => {
  try {
    const { page, per_page, status } = req.query;

    const conversations = await getUserSpruceClient().getConversations({
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 20,
      status: status as string,
    });

    // Transform conversations for inbox format
    const transformedConversations = conversations.conversations.map((conv) => {
      // Extract patient name from title, externalParticipants, or other available fields
      let displayName = "Unknown Patient";

      if (conv.title && conv.title !== "Centre Médical Font") {
        displayName = conv.title;
      } else if (conv.externalParticipants && conv.externalParticipants.length > 0) {
        displayName =
          conv.externalParticipants[0].displayName || conv.externalParticipants[0].contact;
      }

      // Add debug logging to see what we're getting
      console.log("Conversation data:", {
        id: conv.id,
        title: conv.title,
        externalParticipants: conv.externalParticipants,
        finalDisplayName: displayName,
      });

      return {
        id: conv.id,
        entityId: conv.id,
        displayName: displayName,
        lastActivity: conv.lastMessageAt || conv.createdAt,
        unreadCount: conv.unread_count || 0,
        lastMessage: {
          content: "Click to view conversation",
          timestamp: conv.lastMessageAt || conv.createdAt,
          isFromPatient: true,
        },
      };
    });

    res.json(transformedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Get messages for a specific conversation
router.get("/patients/:patientId/messages", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page, per_page } = req.query;

    console.log(`Fetching messages for conversation: ${patientId}`);

    const messages = await getUserSpruceClient().getMessages(patientId, {
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 50,
    });

    console.log(`Found ${messages.messages.length} messages for conversation ${patientId}`);

    // Transform messages for frontend format
    const transformedMessages = messages.messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.sent_at,
      isFromPatient: msg.sender_id !== "doctor" && msg.sender_id !== "system",
      sender: msg.sender_name,
    }));

    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Send a message to a conversation
router.post("/patients/:patientId/messages", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = await getUserSpruceClient().sendMessage(patientId, content);

    res.json({
      message: {
        id: message.id,
        content: message.content,
        timestamp: message.sent_at,
        isFromPatient: false,
        sender: "Doctor",
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error: (error as Error).message });
  }
});

// Webhook endpoint to receive Spruce Health notifications
router.post("/webhook", async (req, res) => {
  try {
    const { event_type, data } = req.body;

    console.log("Spruce webhook received:", event_type, data);

    switch (event_type) {
      case "message.created":
        console.log("New message received in conversation:", data.conversation_id);
        // Here you could emit to WebSocket clients or trigger real-time updates
        break;

      case "conversation.created":
        console.log("New conversation created:", data.conversation_id);
        break;

      case "conversation.updated":
        console.log("Conversation updated:", data.conversation_id);
        break;

      default:
        console.log("Unhandled webhook event:", event_type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Webhook management routes
router.post("/webhooks/setup", async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ message: "Webhook URL is required" });
    }

    // List existing webhooks first
    const existingWebhooks = await getUserSpruceClient().listWebhooks();

    // Delete any existing webhooks for this URL
    if (existingWebhooks.webhooks) {
      for (const webhook of existingWebhooks.webhooks) {
        if (webhook.url === webhookUrl) {
          await getUserSpruceClient().deleteWebhook(webhook.id);
          console.log(`Deleted existing webhook: ${webhook.id}`);
        }
      }
    }

    // Create new webhook
    const webhook = await getUserSpruceClient().createWebhook(webhookUrl, [
      "message.created",
      "conversation.created",
      "conversation.updated",
    ]);

    console.log("Webhook created successfully:", webhook);
    res.json({ success: true, webhook });
  } catch (error) {
    console.error("Error setting up webhook:", error);
    res.status(500).json({ message: "Failed to setup webhook", error: (error as Error).message });
  }
});

router.get("/webhooks", async (req, res) => {
  try {
    const webhooks = await getUserSpruceClient().listWebhooks();
    res.json(webhooks);
  } catch (error) {
    console.error("Error listing webhooks:", error);
    res.status(500).json({ message: "Failed to list webhooks", error: (error as Error).message });
  }
});

router.delete("/webhooks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await getUserSpruceClient().deleteWebhook(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ message: "Failed to delete webhook", error: (error as Error).message });
  }
});

// Search patients using conversations
router.get("/search-patients", async (req, res) => {
  try {
    const { query } = req.query;

    console.log("Fetching patients via Spruce API");
    if (query) {
      console.log(`Searching for patients with query: "${query}"`);
    } else {
      console.log("No search term provided, fetching all patients");
    }

    // Get conversations which contain patient data
    const conversations = await getUserSpruceClient().getConversations({
      per_page: 100,
    });

    // Transform conversations to patient format
    const patients = conversations.conversations.map((conv, index) => ({
      id: index + 1,
      name: (conv as any).participants?.[0]?.name || (conv as any).subject || "Unknown Patient",
      email: (conv as any).participants?.[0]?.email || "",
      phone: (conv as any).participants?.[0]?.phone || "",
      spruceId: conv.id,
      lastActivity: (conv as any).updated_at || conv.createdAt,
    }));

    // Filter by query if provided
    const filteredPatients = query
      ? patients.filter(
          (patient) =>
            patient.name.toLowerCase().includes((query as string).toLowerCase()) ||
            patient.email.toLowerCase().includes((query as string).toLowerCase()) ||
            patient.phone.includes(query as string)
        )
      : patients;

    console.log(`Found ${filteredPatients.length} matching patients in Spruce API`);
    res.json({ patients: filteredPatients });
  } catch (error) {
    console.error("Error searching patients via Spruce API:", error);
    res.status(500).json({ message: "Failed to search patients" });
  }
});

// Send message to conversation
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, message_type = "text" } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const message = await getUserSpruceClient().sendMessage(conversationId, content, message_type);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Mark messages as read
router.patch("/conversations/:conversationId/messages/read", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message_ids } = req.body;

    if (!message_ids || !Array.isArray(message_ids)) {
      return res.status(400).json({ error: "message_ids array is required" });
    }

    await getUserSpruceClient().markMessagesAsRead(conversationId, message_ids);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

// Get rate limit status
router.get("/rate-limit", (req, res) => {
  const rateLimitStatus = getUserSpruceClient().getRateLimitStatus();
  res.json(rateLimitStatus);
});
