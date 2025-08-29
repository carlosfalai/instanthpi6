import { Router, Request, Response } from "express";
import crypto from "crypto";

export const spruceWebhooksRouter = Router();

// Webhook signature verification
function verifySpruceSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.warn("No webhook secret configured - skipping signature verification");
    return true; // Allow webhook in development without secret
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

// Middleware to verify webhook signature
function verifyWebhookSignature(req: Request, res: Response, next: Function) {
  const signature = req.headers["x-spruce-signature"] as string;
  const payload = JSON.stringify(req.body);
  const secret = process.env.SPRUCE_WEBHOOK_SECRET || "";

  if (signature && !verifySpruceSignature(payload, signature, secret)) {
    console.error("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}

// Handle new message webhook
spruceWebhooksRouter.post(
  "/message-created",
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const { data, type } = req.body;

      console.log("Received message-created webhook:", {
        type,
        messageId: data?.id,
        conversationId: data?.conversationId,
        timestamp: new Date().toISOString(),
      });

      // Process the new message
      if (data && data.conversationId) {
        // Here you can update your local cache or trigger real-time updates
        // For now, we'll just log the message
        console.log("New message in conversation:", data.conversationId);

        // You could emit a WebSocket event here to update the frontend in real-time
        // or update a cache of recent messages
      }

      // Respond with 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing message-created webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Handle conversation updated webhook
spruceWebhooksRouter.post(
  "/conversation-updated",
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const { data, type } = req.body;

      console.log("Received conversation-updated webhook:", {
        type,
        conversationId: data?.id,
        timestamp: new Date().toISOString(),
      });

      // Process the conversation update
      if (data && data.id) {
        console.log("Conversation updated:", data.id);

        // This is where you could update conversation metadata
        // like last activity time, participant changes, etc.
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing conversation-updated webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Handle contact updated webhook
spruceWebhooksRouter.post(
  "/contact-updated",
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const { data, type } = req.body;

      console.log("Received contact-updated webhook:", {
        type,
        contactId: data?.id,
        timestamp: new Date().toISOString(),
      });

      // Process the contact update
      if (data && data.id) {
        console.log("Contact updated:", data.id);

        // This could trigger a refresh of patient data
        // or update specific patient information
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing contact-updated webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Health check endpoint for webhook
spruceWebhooksRouter.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    webhooks: ["message-created", "conversation-updated", "contact-updated"],
  });
});

// Generic webhook handler for other events
spruceWebhooksRouter.post(
  "/generic",
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const { data, type } = req.body;

      console.log("Received generic Spruce webhook:", {
        type,
        timestamp: new Date().toISOString(),
        data: JSON.stringify(data).substring(0, 200) + "...",
      });

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing generic webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Webhook registration endpoint
spruceWebhooksRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "https://localhost:5000"; // fallback for development

    const webhooksToRegister = [
      {
        url: `${baseUrl}/api/webhooks/spruce/message-created`,
        events: ["message.created", "message.delivered", "message.read"],
      },
      {
        url: `${baseUrl}/api/webhooks/spruce/conversation-updated`,
        events: ["conversation.created", "conversation.updated", "conversation.archived"],
      },
      {
        url: `${baseUrl}/api/webhooks/spruce/contact-updated`,
        events: ["contact.created", "contact.updated", "contact.deleted"],
      },
      {
        url: `${baseUrl}/api/webhooks/spruce/generic`,
        events: [
          "appointment.created",
          "appointment.updated",
          "appointment.cancelled",
          "call.started",
          "call.ended",
        ],
      },
    ];

    console.log("Registering Spruce webhooks:", webhooksToRegister);

    // Note: This would require Spruce API credentials to actually register
    // For now, return the webhook URLs that need to be configured manually
    res.json({
      success: true,
      message: "Webhook endpoints ready for registration",
      webhooks: webhooksToRegister,
      instructions: "Configure these webhook URLs in your Spruce Health dashboard",
    });
  } catch (error) {
    console.error("Error registering webhooks:", error);
    res.status(500).json({ error: "Failed to register webhooks" });
  }
});

export default spruceWebhooksRouter;
