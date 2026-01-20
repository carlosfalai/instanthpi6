import { Router } from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { SpruceHealthClient } from "../spruce-health-client";

const router = Router();

// Spruce API configuration
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

// Check if running in local development mode - skip physician DB lookups
const isLocalDev = process.env.NODE_ENV === "development";

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Helper to determine message channel type (SMS vs Spruce Secure Message)
function getMessageChannelType(
  msg: any,
  conversationType?: string
): "sms" | "secure" | "email" | "unknown" {
  // Check various fields that indicate channel type
  const type = msg.type || msg.channel || msg.channelType || msg.messageType || "";
  const typeStr = String(type).toLowerCase();

  if (typeStr.includes("sms") || typeStr.includes("text")) return "sms";
  if (typeStr.includes("secure") || typeStr.includes("spruce") || typeStr.includes("internal"))
    return "secure";
  if (typeStr.includes("email")) return "email";

  // Check conversation type field (passed from conversation metadata)
  const convType = conversationType || msg.conversationType || msg.conversation_type || "";
  const convTypeStr = String(convType).toLowerCase();
  if (convTypeStr.includes("sms") || convTypeStr === "sms") return "sms";
  if (
    convTypeStr.includes("secure") ||
    convTypeStr.includes("spruce") ||
    convTypeStr === "secure_messaging"
  )
    return "secure";
  if (convTypeStr.includes("email")) return "email";

  // Check message content patterns for SMS-like messages
  const content = msg.content || msg.text || msg.body || "";
  const contentStr = String(content).toLowerCase();

  // Phone number patterns indicate SMS
  if (
    contentStr.includes("sent an invitation to (") ||
    contentStr.match(/\(\d{3}\)\s*\d{3}-\d{4}/)
  ) {
    return "sms";
  }

  // Spruce Link or connection messages are typically from the secure system
  if (contentStr.includes("spruce link") || contentStr.includes("has connected")) {
    return "secure";
  }

  // Default to secure if message has significant content (Spruce secure messages tend to be longer)
  if (content.length > 50) {
    return "secure";
  }

  return "unknown";
}

// Helper to extract attachments from message
function extractAttachments(msg: any): Array<{
  id: string;
  type: "image" | "video" | "document" | "audio" | "other";
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}> {
  const attachments: any[] = [];

  // Check various attachment fields
  const rawAttachments = msg.attachments || msg.media || msg.files || msg.images || [];

  for (const att of rawAttachments) {
    const mimeType = att.mimeType || att.mime_type || att.contentType || att.type || "";
    const url = att.url || att.downloadUrl || att.download_url || att.src || att.uri || "";

    if (!url) continue;

    let type: "image" | "video" | "document" | "audio" | "other" = "other";
    const mimeStr = String(mimeType).toLowerCase();

    if (mimeStr.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) {
      type = "image";
    } else if (mimeStr.includes("video") || /\.(mp4|webm|mov|avi|mkv)$/i.test(url)) {
      type = "video";
    } else if (mimeStr.includes("audio") || /\.(mp3|wav|ogg|m4a)$/i.test(url)) {
      type = "audio";
    } else if (
      mimeStr.includes("pdf") ||
      mimeStr.includes("document") ||
      /\.(pdf|doc|docx|txt|rtf)$/i.test(url)
    ) {
      type = "document";
    }

    attachments.push({
      id: att.id || att.attachmentId || `att_${Date.now()}_${attachments.length}`,
      type,
      url,
      name: att.name || att.filename || att.fileName || att.title || undefined,
      mimeType: mimeType || undefined,
      size: att.size || att.fileSize || undefined,
    });
  }

  // Also check for inline image/media in message content
  if (msg.imageUrl || msg.image_url) {
    attachments.push({
      id: `inline_${Date.now()}`,
      type: "image",
      url: msg.imageUrl || msg.image_url,
      name: "Image",
    });
  }

  if (msg.videoUrl || msg.video_url) {
    attachments.push({
      id: `video_${Date.now()}`,
      type: "video",
      url: msg.videoUrl || msg.video_url,
      name: "Video",
    });
  }

  return attachments;
}

// Helper to determine if message is from patient
function isFromPatient(msg: any): boolean {
  // Explicit field
  if (msg.isFromPatient !== undefined) return msg.isFromPatient;
  if (msg.is_from_patient !== undefined) return msg.is_from_patient;
  if (msg.fromPatient !== undefined) return msg.fromPatient;

  // Check direction
  const direction = msg.direction || msg.messageDirection || "";
  if (direction === "inbound" || direction === "incoming" || direction === "received") return true;
  if (direction === "outbound" || direction === "outgoing" || direction === "sent") return false;

  // Check author/sender type
  const authorType = msg.authorType || msg.author_type || msg.senderType || msg.sender_type || "";
  const authorTypeStr = String(authorType).toLowerCase();
  if (
    authorTypeStr.includes("patient") ||
    authorTypeStr.includes("external") ||
    authorTypeStr.includes("contact")
  )
    return true;
  if (
    authorTypeStr.includes("provider") ||
    authorTypeStr.includes("doctor") ||
    authorTypeStr.includes("staff") ||
    authorTypeStr.includes("internal")
  )
    return false;

  // Check role field
  const role = msg.author?.role || msg.sender?.role || "";
  const roleStr = String(role).toLowerCase();
  if (roleStr.includes("patient")) return true;
  if (roleStr.includes("provider") || roleStr.includes("doctor")) return false;

  // Check sender_name for provider indicators (MD, Dr., clinic name patterns)
  // Note: SpruceHealthClient uses snake_case (sender_name)
  const senderName =
    msg.sender_name || msg.senderName || msg.author?.displayName || msg.from_name || "";
  const senderNameStr = String(senderName).toLowerCase();

  console.log(`[isFromPatient DEBUG] senderName="${senderName}" senderNameStr="${senderNameStr}"`);

  // Provider indicators - NOT from patient
  if (
    senderNameStr.includes(", md") ||
    senderNameStr.includes(" md") ||
    senderNameStr.endsWith(" md")
  ) {
    console.log(`[isFromPatient] Detected MD suffix - returning false (provider)`);
    return false;
  }
  if (senderNameStr.includes("dr.") || senderNameStr.includes("dr ")) {
    console.log(`[isFromPatient] Detected Dr. prefix - returning false (provider)`);
    return false;
  }
  if (
    senderNameStr.includes("clinic") ||
    senderNameStr.includes("centre") ||
    senderNameStr.includes("medical")
  ) {
    console.log(`[isFromPatient] Detected clinic/centre/medical - returning false (provider)`);
    return false;
  }
  if (senderNameStr.includes("truckstop") || senderNameStr.includes("instanthpi")) {
    console.log(`[isFromPatient] Detected truckstop/instanthpi - returning false (provider)`);
    return false;
  }
  if (senderNameStr.includes("system") || senderNameStr.includes("notification")) {
    console.log(`[isFromPatient] Detected system/notification - returning false (provider)`);
    return false;
  }

  // Check if this is a Spruce system message (invitation, connection)
  const content = msg.content || msg.text || msg.body || "";
  const contentStr = String(content).toLowerCase();
  if (contentStr.includes("sent an invitation") || contentStr.includes("has connected")) {
    console.log(
      `[isFromPatient] Detected invitation/connection system message - returning false (provider)`
    );
    return false;
  }

  // Default to true (patient) if unknown - safer to assume inbound
  console.log(`[isFromPatient] No provider indicators found - returning true (patient)`);
  return true;
}

// Get conversation history/messages
// Supports both routes: /:conversationId/history and /history/:conversationId
router.get("/:conversationId/history", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    // Load doctor credentials
    const doctorId = "default-doctor";
    let spruceAccessId: string | null = null;
    let spruceApiKey: string | null = null;

    // Skip physician DB lookup in local dev - use env vars directly
    if (!isLocalDev) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: physician, error: physicianErr } = await supabase
          .from("physicians")
          .select("spruce_access_id, spruce_api_key")
          .eq("id", doctorId)
          .single();

        if (physicianErr && physicianErr.code !== "PGRST205") {
          console.error("Supabase physicians read error:", physicianErr);
        }

        spruceAccessId = physician?.spruce_access_id || null;
        spruceApiKey = physician?.spruce_api_key || null;
      }
    }

    // Fallback to environment variables
    if (!spruceAccessId) {
      spruceAccessId = process.env.SPRUCE_ACCESS_ID || null;
    }
    if (!spruceApiKey) {
      spruceApiKey = process.env.SPRUCE_API_KEY || null;
    }

    if (!spruceAccessId || !spruceApiKey) {
      return res.status(400).json({
        error: "Spruce credentials not configured",
        message: "Please add Spruce Access ID and API Key in Doctor Profile → API Integrations.",
      });
    }

    const client = new SpruceHealthClient({
      bearerToken: spruceApiKey || spruceAccessId || "",
    });

    console.log(`Fetching messages for conversation ${conversationId}...`);

    // First, try to get conversation metadata to determine channel type
    let conversationType: string | undefined;
    try {
      const conversation = await client.getConversation(conversationId);
      conversationType = conversation?.type;
      console.log(`Conversation type: ${conversationType}`);
    } catch (convErr) {
      console.log(`Could not fetch conversation metadata: ${convErr}`);
    }

    const messagesResponse = await client.getMessages(conversationId, { per_page: 100 });
    const rawMessages = messagesResponse.messages || [];

    // Transform messages with enhanced data and sort chronologically (earliest first)
    const transformedMessages = rawMessages.map((msg: any) => ({
      id: msg.id || msg.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: msg.content || msg.text || msg.body || "",
      timestamp:
        msg.sent_at ||
        msg.sentAt ||
        msg.created_at ||
        msg.createdAt ||
        msg.timestamp ||
        new Date().toISOString(),
      isFromPatient: isFromPatient(msg),
      channelType: getMessageChannelType(msg, conversationType),
      senderName:
        msg.sender_name || msg.author?.displayName || (isFromPatient(msg) ? "Patient" : "Provider"),
      attachments: extractAttachments(msg),
      read: msg.read !== undefined ? msg.read : true,
    }));

    // Sort by timestamp - earliest first (chronological order)
    transformedMessages.sort((a: any, b: any) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Return in expected format
    res.json(transformedMessages);
  } catch (error: any) {
    console.error("Error fetching conversation history:", error.response?.data || error.message);

    // If no messages found, return empty array instead of error
    if (error.response?.status === 404) {
      return res.json([]);
    }

    res.status(error.response?.status || 500).json({
      error: "Failed to fetch conversation history",
      message: error.message,
      details: error.response?.data,
    });
  }
});

export default router;
