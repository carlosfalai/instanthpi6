import { Router } from "express";
import axios from "axios";
import crypto from "crypto";
import { storage } from "../storage";
import { SpruceHealthClient } from "../spruce-health-client";

// Define interface for Spruce patient data from API
interface SpruceApiPatient {
  id: string;
  // Name fields - Spruce API uses multiple formats
  givenName?: string;
  given_name?: string;
  familyName?: string;
  family_name?: string;
  displayName?: string;
  display_name?: string;
  name?: string;
  // Contact info - can be nested or flat
  email?: string;
  email_address?: string;
  emailAddresses?: Array<{ value?: string; address?: string }>;
  phone?: string;
  phone_number?: string;
  phoneNumbers?: Array<{ value?: string; displayValue?: string }>;
  // Other fields
  date_of_birth?: string;
  dateOfBirth?: string;
  birth_date?: string;
  gender?: string;
  language?: string;
  preferred_language?: string;
  last_visit?: string;
  status?: string;
}

// Simplified patient interface for internal use
interface SprucePatient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  last_visit?: string;
  status?: string;
}

// Interface for Spruce API message response
interface SpruceApiMessage {
  id?: string;
  content?: string;
  text?: string;
  created_at?: string;
  createdAt?: string;
  sender?: {
    type?: string;
    id?: string;
  };
  media?: {
    url?: string;
  };
}

// Interface for formatted message
interface FormattedMessage {
  id: string;
  patientId: string;
  conversationId: string;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  sender: string;
  attachmentUrl: string | null;
}

// Helper to get error message from unknown error
function getSpruceErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown error occurred';
}

// Initialize Spruce Health client
const SPRUCE_BEARER_TOKEN = process.env.SPRUCE_BEARER_TOKEN;
const SPRUCE_ACCESS_ID = process.env.SPRUCE_ACCESS_ID;

if (!SPRUCE_BEARER_TOKEN) {
  console.warn(
    "⚠️ WARNING: No Spruce bearer token found. Set SPRUCE_BEARER_TOKEN environment variable for API access."
  );
}

console.log("🔑 Spruce Health API Configuration:");
console.log("📋 Access ID:", SPRUCE_ACCESS_ID || "Not provided");
console.log("🔐 Bearer Token:", SPRUCE_BEARER_TOKEN ? "Configured" : "Missing");

const spruceClient = new SpruceHealthClient({
  bearerToken: SPRUCE_BEARER_TOKEN || "",
  maxRetries: 3,
  retryDelay: 1000,
});

// Create axios instance for direct API calls when needed
const spruceApi = axios.create({
  baseURL: "https://api.sprucehealth.com/v1",
  headers: {
    Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Define interface for Spruce message
interface SpruceMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
  message_type: string;
  read?: boolean;
}

export const router = Router();

// Store for real-time message updates
const messageUpdates = new Map<string, any[]>();

// Store webhook secret (should be from environment variable in production)
const WEBHOOK_SECRET = process.env.SPRUCE_WEBHOOK_SECRET || "";

// Verify Spruce webhook signature
function verifySpruceSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("base64");

  return calculatedSignature === signature;
}

// Webhook endpoint to receive real-time updates from Spruce
router.post("/webhook", async (req, res) => {
  try {
    // Verify signature if secret is configured
    if (WEBHOOK_SECRET) {
      const signature = req.headers["x-spruce-signature"] as string;
      const payload = JSON.stringify(req.body);

      if (!verifySpruceSignature(payload, signature, WEBHOOK_SECRET)) {
        console.error("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const { event, data } = req.body;

    console.log("Received Spruce webhook event:", event);

    // Handle different event types according to Spruce documentation
    if (event === "conversationItem.created") {
      // This is a new message in a conversation
      const conversationId = data.conversationId || data.conversation_id;
      if (conversationId) {
        if (!messageUpdates.has(conversationId)) {
          messageUpdates.set(conversationId, []);
        }
        messageUpdates.get(conversationId)?.push({
          ...data,
          timestamp: new Date().toISOString(),
        });

        // Clean up old updates after 1 minute
        setTimeout(() => {
          const updates = messageUpdates.get(conversationId);
          if (updates && updates.length > 0) {
            updates.shift();
          }
        }, 60000);
      }
    } else if (event === "conversation.updated") {
      // Handle conversation updates (like unread count changes)
      console.log("Conversation updated:", data);
    } else if (event === "conversation.created") {
      // Handle new conversation
      console.log("New conversation created:", data);
    }

    // Acknowledge receipt with 200 status (required by Spruce)
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return 500 to trigger retry from Spruce
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

// Endpoint to check for new messages (for polling)
router.get("/conversations/:conversationId/updates", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const updates = messageUpdates.get(conversationId) || [];

    // Clear the updates after sending
    if (updates.length > 0) {
      messageUpdates.set(conversationId, []);
    }

    res.json({ updates, hasUpdates: updates.length > 0 });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res.status(500).json({ updates: [], hasUpdates: false });
  }
});

// Get conversations for inbox and messages page
router.get("/conversations", async (req, res) => {
  try {
    const { page, per_page, status } = req.query;

    const conversations = await spruceClient.getConversations({
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 200,
      status: status as string,
    });

    // Transform conversations for spruce-messages-page format
    const transformedConversations = conversations.conversations.map((conv) => ({
      id: conv.id,
      patientName: conv.externalParticipants?.[0]?.displayName || conv.title || "Unknown Patient",
      lastMessage: "Click to view conversation",
      lastMessageTime:
        conv.lastMessageAt ||
        conv.createdAt ||
        new Date().toISOString(),
      unreadCount: conv.unread_count || 0,
    }));

    res.json(transformedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Get messages for a specific conversation (for spruce-messages-page)
router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page, per_page } = req.query;

    const messages = await spruceClient.getMessages(conversationId, {
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 50,
    });

    // Transform messages for spruce-messages-page format
    const transformedMessages = messages.messages.map((msg) => ({
      id: msg.id,
      content: msg.content || "",
      timestamp: msg.sent_at || new Date().toISOString(),
      isFromPatient: msg.sender_id !== "doctor" && msg.sender_name !== "Doctor",
      senderName: msg.sender_name || "Unknown",
    }));

    res.json(transformedMessages);
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Get messages for a specific patient (legacy endpoint)
router.get("/patients/:patientId/messages", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page, per_page } = req.query;

    const messages = await spruceClient.getMessages(patientId, {
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 50,
    });

    // Transform messages for frontend format
    const transformedMessages = messages.messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.sent_at,
      isFromPatient: msg.sender_id !== "doctor",
      sender: msg.sender_name,
    }));

    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Search patients in real-time from Spruce API only
router.get("/search-patients", async (req, res) => {
  try {
    const { query } = req.query;

    // Search using Spruce API
    try {
      console.log("Fetching patients via Spruce API");

      let response;

      if (!query || typeof query !== "string") {
        // If no query is provided, fetch all patients
        console.log("No search term provided, fetching all patients");
        response = await spruceApi.get("/v1/contacts", {
          params: {
            limit: 100,
          },
        });
      } else {
        const searchTerm = query.toLowerCase();
        console.log(`Searching for patients with term: "${searchTerm}"`);

        // Based on documentation, use the confirmed endpoint /v1/contacts
        console.log("Using documented endpoint /v1/contacts with search query");
        response = await spruceApi.get("/v1/contacts", {
          params: {
            query: searchTerm, // Use 'query' as parameter per the docs
            limit: 100,
          },
        });
      }

      // More flexible data extraction from response
      const allPatients =
        response.data.patients || response.data.data || response.data.contacts || [];
      console.log(`Received ${allPatients.length} patients from Spruce API`);

      // Log the raw response for debugging
      console.log(
        "Raw Spruce API response structure:",
        JSON.stringify(response.data).substring(0, 500) + "..."
      );

      // If no search term is provided, use all patients; otherwise filter
      let filteredPatients;

      // Only filter if a search term was provided
      if (query && typeof query === "string") {
        const searchTerm = query.toLowerCase();
        filteredPatients = allPatients.filter((patient: SpruceApiPatient) => {
          // Search across all possible name/contact fields
          const givenName = (patient.givenName || patient.given_name || "").toLowerCase();
          const familyName = (patient.familyName || patient.family_name || "").toLowerCase();
          const displayName = (patient.displayName || patient.display_name || "").toLowerCase();

          // Check for email in nested objects
          let emailToSearch = "";
          if (
            patient.emailAddresses &&
            Array.isArray(patient.emailAddresses) &&
            patient.emailAddresses.length > 0
          ) {
            emailToSearch = (
              patient.emailAddresses[0].value ||
              patient.emailAddresses[0].address ||
              ""
            ).toLowerCase();
          } else {
            emailToSearch = (patient.email_address || patient.email || "").toLowerCase();
          }

          // Check for phone in nested objects
          let phoneToSearch = "";
          if (
            patient.phoneNumbers &&
            Array.isArray(patient.phoneNumbers) &&
            patient.phoneNumbers.length > 0
          ) {
            phoneToSearch =
              patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || "";
          } else {
            phoneToSearch = patient.phone_number || patient.phone || "";
          }

          return (
            givenName.includes(searchTerm) ||
            familyName.includes(searchTerm) ||
            displayName.includes(searchTerm) ||
            emailToSearch.includes(searchTerm) ||
            phoneToSearch.includes(searchTerm)
          );
        });
      } else {
        // Use all patients when no search term is provided
        filteredPatients = allPatients;
      }

      console.log(`Found ${filteredPatients.length} matching patients in Spruce API`);

      // Convert Spruce patients to our format with better field mapping
      const mappedPatients = filteredPatients.map((patient: SpruceApiPatient) => {
        // Extract name components based on the Spruce API response structure
        const givenName = patient.givenName || patient.given_name || "";
        const familyName = patient.familyName || patient.family_name || "";
        const displayName = patient.displayName || patient.display_name || "";

        // Compose a proper name using available fields
        const fullName =
          displayName ||
          (givenName && familyName
            ? `${givenName} ${familyName}`
            : givenName || familyName || "Unknown Name");

        // Extract phone from potentially nested objects
        let phoneNumber = "";
        if (
          patient.phoneNumbers &&
          Array.isArray(patient.phoneNumbers) &&
          patient.phoneNumbers.length > 0
        ) {
          phoneNumber = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || "";
        } else {
          phoneNumber = patient.phone_number || patient.phone || "";
        }

        // Extract email from potentially nested objects
        let emailAddress = "";
        if (
          patient.emailAddresses &&
          Array.isArray(patient.emailAddresses) &&
          patient.emailAddresses.length > 0
        ) {
          emailAddress = patient.emailAddresses[0].value || patient.emailAddresses[0].address || "";
        } else {
          emailAddress = patient.email_address || patient.email || "";
        }

        // Extract date of birth
        const dob = patient.dateOfBirth || patient.birth_date || patient.date_of_birth || "";

        return {
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          dateOfBirth: dob,
          gender: (patient.gender || "unknown").toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.id,
        };
      });

      res.json({
        patients: mappedPatients,
        source: "spruce",
      });
    } catch (spruceError: unknown) {
      const axiosErr = spruceError as { message?: string; response?: { data?: { message?: string }; status?: number; headers?: unknown } };
      // Enhanced error logging with detailed information
      console.error("Error searching patients in Spruce API:", {
        message: getSpruceErrorMessage(spruceError),
        response: axiosErr.response?.data,
        status: axiosErr.response?.status,
        headers: axiosErr.response?.headers,
      });

      // Return more specific error information
      return res.status(axiosErr.response?.status || 500).json({
        patients: [],
        source: "spruce",
        error: "Failed to search patients in Spruce API",
        message: axiosErr.response?.data?.message || getSpruceErrorMessage(spruceError),
        details: axiosErr.response?.data,
      });
    }
  } catch (error: unknown) {
    console.error("Error in patient search:", error);
    res.status(500).json({
      message: "Failed to search patients",
      error: getSpruceErrorMessage(error),
    });
  }
});

// Fetch contacts from Spruce API - no local database used
router.post("/sync-patients", async (req, res) => {
  try {
    // Get patients directly from Spruce API using documented endpoint
    try {
      // Based on documentation, use the confirmed endpoint /v1/contacts
      console.log("Using documented endpoint /v1/contacts for sync");
      const response = await spruceApi.get("/v1/contacts", {
        params: {
          limit: 200,
        },
      });

      // Log the raw response for debugging
      console.log(
        "Raw Spruce API response structure:",
        JSON.stringify(response.data).substring(0, 500) + "..."
      );

      // More flexible data extraction from response
      const sprucePatients =
        response.data.contacts || response.data.patients || response.data.data || [];

      // Convert Spruce patients to our format with better field mapping
      const mappedPatients = sprucePatients.map((patient: SpruceApiPatient) => {
        // Extract name components based on the Spruce API response structure
        const givenName = patient.givenName || patient.given_name || "";
        const familyName = patient.familyName || patient.family_name || "";
        const displayName = patient.displayName || patient.display_name || "";

        // Compose a proper name using available fields
        const fullName =
          displayName ||
          (givenName && familyName
            ? `${givenName} ${familyName}`
            : givenName || familyName || "Unknown Name");

        // Extract phone from potentially nested objects
        let phoneNumber = "";
        if (
          patient.phoneNumbers &&
          Array.isArray(patient.phoneNumbers) &&
          patient.phoneNumbers.length > 0
        ) {
          phoneNumber = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || "";
        } else {
          phoneNumber = patient.phone_number || patient.phone || "";
        }

        // Extract email from potentially nested objects
        let emailAddress = "";
        if (
          patient.emailAddresses &&
          Array.isArray(patient.emailAddresses) &&
          patient.emailAddresses.length > 0
        ) {
          emailAddress = patient.emailAddresses[0].value || patient.emailAddresses[0].address || "";
        } else {
          emailAddress = patient.email_address || patient.email || "";
        }

        // Extract date of birth
        const dob = patient.dateOfBirth || patient.birth_date || patient.date_of_birth || "";

        return {
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          dateOfBirth: dob,
          gender: (patient.gender || "unknown").toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.id,
        };
      });

      res.json({
        message: `Retrieved ${mappedPatients.length} patients from Spruce API`,
        count: mappedPatients.length,
        source: "spruce",
        patients: mappedPatients,
      });
    } catch (spruceError: unknown) {
      const axiosErr = spruceError as { message?: string; response?: { data?: { message?: string }; status?: number; headers?: unknown } };
      // Enhanced error logging with detailed information
      console.error("Error connecting to Spruce API:", {
        message: getSpruceErrorMessage(spruceError),
        response: axiosErr.response?.data,
        status: axiosErr.response?.status,
        headers: axiosErr.response?.headers,
      });

      // Return more useful error information
      return res.status(axiosErr.response?.status || 500).json({
        message: "Failed to connect to Spruce API",
        error: axiosErr.response?.data?.message || getSpruceErrorMessage(spruceError),
        count: 0,
        source: "spruce",
        patients: [],
      });
    }
  } catch (error: unknown) {
    console.error("Error in sync-patients endpoint:", error);
    res.status(500).json({
      message: "Failed to sync patients",
      error: getSpruceErrorMessage(error),
    });
  }
});

// One-click refresh for patient data from Spruce API
router.post("/refresh-patients", async (req, res) => {
  try {
    console.log("One-click patient data refresh requested");

    // Create timestamp for logging
    const timestamp = new Date().toISOString();

    // Attempt to get fresh patient data from Spruce API
    try {
      // Common headers for cache control
      const cacheHeaders = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      };

      // Based on documentation, use the confirmed endpoint /v1/contacts
      console.log("Using documented endpoint /v1/contacts for refresh");
      const response = await spruceApi.get("/v1/contacts", {
        params: {
          _ts: timestamp, // Cache-busting
          limit: 200,
        },
        headers: cacheHeaders,
      });

      // Log the raw response for debugging
      console.log(
        "Raw Spruce API response structure:",
        JSON.stringify(response.data).substring(0, 500) + "..."
      );

      // More flexible data extraction from response
      const sprucePatients =
        response.data.contacts || response.data.patients || response.data.data || [];
      console.log(`Successfully refreshed ${sprucePatients.length} patients from Spruce API`);

      // Format and return the patient data with better field mapping, checking for nested fields
      const formattedPatients = sprucePatients.map((patient: SpruceApiPatient) => {
        // Extract name components based on the Spruce API response structure
        const givenName = patient.givenName || patient.given_name || "";
        const familyName = patient.familyName || patient.family_name || "";
        const displayName = patient.displayName || patient.display_name || "";

        // Compose a proper name using available fields
        const fullName =
          displayName ||
          (givenName && familyName
            ? `${givenName} ${familyName}`
            : givenName || familyName || "Unknown Name");

        // Extract phone from potentially nested objects
        let phoneNumber = "";
        if (
          patient.phoneNumbers &&
          Array.isArray(patient.phoneNumbers) &&
          patient.phoneNumbers.length > 0
        ) {
          phoneNumber = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || "";
        } else {
          phoneNumber = patient.phone_number || patient.phone || "";
        }

        // Extract email from potentially nested objects
        let emailAddress = "";
        if (
          patient.emailAddresses &&
          Array.isArray(patient.emailAddresses) &&
          patient.emailAddresses.length > 0
        ) {
          emailAddress = patient.emailAddresses[0].value || patient.emailAddresses[0].address || "";
        } else {
          emailAddress = patient.email_address || patient.email || "";
        }

        return {
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          dateOfBirth: patient.birth_date || patient.date_of_birth || "",
          gender: (patient.gender || "unknown").toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.id,
        };
      });

      res.json({
        success: true,
        message: `Successfully refreshed ${formattedPatients.length} patients from Spruce API`,
        timestamp: timestamp,
        source: "spruce",
        count: formattedPatients.length,
        patients: formattedPatients,
      });
    } catch (spruceError: unknown) {
      // Enhanced error logging with detailed information
      const axiosErr = spruceError as { message?: string; response?: { data?: { message?: string }; status?: number; headers?: unknown } };
      console.error("Error refreshing data from Spruce API:", {
        message: getSpruceErrorMessage(spruceError),
        response: axiosErr.response?.data,
        status: axiosErr.response?.status,
        headers: axiosErr.response?.headers,
      });

      res.status(axiosErr.response?.status || 500).json({
        success: false,
        message: "Failed to refresh patient data from Spruce API",
        error: axiosErr.response?.data?.message || getSpruceErrorMessage(spruceError),
        details: axiosErr.response?.data,
      });
    }
  } catch (error: unknown) {
    console.error("Error in refresh-patients endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Error processing refresh request",
      error: getSpruceErrorMessage(error) || "Unknown error",
    });
  }
});

// Setup webhook with Spruce
router.post("/setup-webhook", async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: "Webhook URL is required",
      });
    }

    // Create webhook subscription with Spruce
    const webhook = await spruceClient.createWebhook(webhookUrl, [
      "message.created",
      "message.received",
      "conversation.updated",
    ]);

    console.log("Webhook created successfully:", webhook);

    res.json({
      success: true,
      message: "Webhook setup successful",
      webhook,
    });
  } catch (error: unknown) {
    console.error("Error setting up webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to setup webhook",
      error: getSpruceErrorMessage(error),
    });
  }
});

// List active webhooks
router.get("/webhooks", async (req, res) => {
  try {
    const webhooks = await spruceClient.listWebhooks();
    res.json({
      success: true,
      webhooks,
    });
  } catch (error: unknown) {
    console.error("Error listing webhooks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list webhooks",
      error: getSpruceErrorMessage(error),
    });
  }
});

// Test endpoint to verify Spruce API connectivity
router.get("/test-connection", async (req, res) => {
  try {
    // From the documentation, we see that /v1/contacts is the correct endpoint
    const response = await spruceApi.get("/v1/contacts", {
      params: {
        limit: 1, // Request just one contact to minimize data transfer
      },
    });
    res.json({
      success: true,
      message: "Successfully connected to Spruce API",
      data: response.data,
    });
  } catch (error: unknown) {
    // Try webhooks endpoint as a fallback
    try {
      const fallbackResponse = await spruceApi.get("/v1/webhooks/endpoints");
      res.json({
        success: true,
        message: "Successfully connected to Spruce API (fallback endpoint)",
        data: fallbackResponse.data,
      });
    } catch (fallbackError: unknown) {
      // Extract axios error details if available
      const axiosError = error as { response?: { data?: unknown; status?: number; headers?: unknown } };
      const fallbackAxiosError = fallbackError as { response?: { data?: unknown; status?: number; headers?: unknown } };

      console.error("Spruce API connection test failed:", {
        message: getSpruceErrorMessage(error),
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        headers: axiosError.response?.headers,
      });

      // Check for unauthorized access
      if (axiosError.response?.status === 403) {
        return res.status(403).json({
          success: false,
          message:
            "API key authentication failed. Please check your SPRUCE_API_KEY environment variable.",
          error: "Authorization failed",
          details: axiosError.response?.data,
        });
      }

      // If we received headers from the API, show them for debugging
      const receivedHeaders = axiosError.response?.headers || fallbackAxiosError.response?.headers;

      res.status(axiosError.response?.status || 500).json({
        success: false,
        message: "Failed to connect to Spruce API",
        error: getSpruceErrorMessage(error),
        details: axiosError.response?.data,
        apiHeaders: receivedHeaders,
      });
    }
  }
});

// Send a message exclusively via Spruce Health API
router.post("/messages", async (req, res) => {
  try {
    const { conversationId, message, patientId, messageType } = req.body;

    if ((!conversationId && !patientId) || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      // Send the message through Spruce API
      console.log("Sending message through Spruce API");

      if (conversationId) {
        // Send to conversation directly
        const spruceResponse = await spruceClient.sendMessage(conversationId, message, "text");

        res.json({
          id: spruceResponse.id,
          conversationId,
          content: message,
          timestamp: new Date().toISOString(),
          isFromPatient: false,
          senderName: "Doctor",
        });
      } else {
        // Legacy: send to patient
        const spruceResponse = await spruceApi.post("/v1/messages", {
          patient_id: patientId,
          content: message,
          message_type: messageType || "GENERAL",
          sender_id: 1, // Doctor ID
        });

        res.json({
          id: spruceResponse.data.id,
          patientId,
          senderId: 1,
          content: message,
          isFromPatient: false,
          spruceMessageId: spruceResponse.data.id,
          timestamp: new Date(),
        });
      }
    } catch (spruceError: unknown) {
      console.error("Error sending message to Spruce API:", getSpruceErrorMessage(spruceError));
      res.status(500).json({ message: "Failed to send message to Spruce API" });
    }
  } catch (error: unknown) {
    console.error("Error sending message:", getSpruceErrorMessage(error));
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get patient messages exclusively from Spruce Health API
router.get("/patients/:patientId/messages", async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Get messages from Spruce API using correct endpoint format
    console.log(`Retrieving messages for patient ${patientId}`);

    // Use the correct endpoint with required parameters
    const conversationsResponse = await spruceApi.get(`/v1/conversations`, {
      params: {
        orderBy: "lastActivity",
        limit: 100,
        contactId: patientId,
      },
    });
    console.log(
      "Raw Spruce API messages response structure:",
      JSON.stringify(conversationsResponse.data).substring(0, 500) + "..."
    );

    // Extract conversations from response
    const conversations = conversationsResponse.data.conversations || [];
    let allMessages: FormattedMessage[] = [];

    // For each conversation, fetch messages
    for (const conversation of conversations) {
      const conversationId = conversation.id;
      if (!conversationId) continue;

      try {
        // Try the direct messages endpoint for this conversation
        const messagesResponse = await spruceApi.get(
          `/v1/conversations/${conversationId}/messages`,
          {
            params: {
              per_page: 50,
              sort: "desc",
            },
          }
        );

        // Access the actual messages array from the response
        const rawMessages = messagesResponse.data.messages || messagesResponse.data || [];
        const conversationMessages = Array.isArray(rawMessages) ? rawMessages : [];

        if (conversationMessages.length > 0) {
          console.log(
            `Found ${conversationMessages.length} messages in conversation ${conversationId}`
          );
        }

        // Add messages to allMessages only if we have valid array data
        if (conversationMessages.length > 0) {
          allMessages = [
            ...allMessages,
            ...conversationMessages.map((msg: SpruceApiMessage) => ({
              id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              patientId: patientId,
              conversationId: conversationId,
              content: msg.content || msg.text || "",
              timestamp: msg.created_at || msg.createdAt || new Date().toISOString(),
              isFromPatient: msg.sender && msg.sender.type === "external",
              sender: msg.sender
                ? msg.sender.type === "external"
                  ? "Patient"
                  : "Doctor"
                : "Unknown",
              attachmentUrl: msg.media && msg.media.url ? msg.media.url : null,
            })),
          ];
        }
      } catch (err) {
        console.error(`Error fetching messages for conversation ${conversationId}:`, err);
      }
    }

    // Check if any message contains RAMQ card images
    const ramqVerification = allMessages.some(
      (msg) =>
        (msg.content && msg.content.toLowerCase().includes("ramq")) ||
        (msg.attachmentUrl && msg.attachmentUrl.toLowerCase().includes("photo"))
    );

    // Sort messages by timestamp
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`Found ${allMessages.length} messages for patient ${patientId}`);

    // Include RAMQ verification status in the response
    res.json({
      messages: allMessages,
      metadata: {
        ramqVerified: ramqVerification || false,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching messages from Spruce API:", {
      message: getSpruceErrorMessage(error),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Return empty array with error details
    res.status(500).json({
      success: false,
      error: getSpruceErrorMessage(error),
      messages: [],
      metadata: {
        ramqVerified: false,
      },
    });
  }
});

// Send message to patient via Spruce API
router.post("/patients/:patientId/messages", async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    console.log(`Sending message to patient ${patientId}: ${content.substring(0, 50)}...`);

    // Find conversation ID first before sending a message
    const conversationsResponse = await spruceApi.get(`/v1/contacts/${patientId}/conversations`);
    if (
      !conversationsResponse.data ||
      !conversationsResponse.data.conversations ||
      !conversationsResponse.data.conversations.length
    ) {
      // Create a new conversation if none exists
      console.log(`No existing conversations found for patient ${patientId}, creating a new one`);
      const newConversationResponse = await spruceApi.post("/v1/conversations", {
        contact_ids: [patientId],
        subject: "New conversation",
      });
      const conversationId = newConversationResponse.data.id;

      // Now send the message to the newly created conversation
      const response = await spruceApi.post(`/v1/conversations/${conversationId}/messages`, {
        content: content,
        type: "text",
      });
      return response;
    }

    // Use the first conversation found to send the message
    const conversationId = conversationsResponse.data.conversations[0].id;
    console.log(`Using existing conversation ID: ${conversationId} for patient ${patientId}`);
    const response = await spruceApi.post(`/v1/conversations/${conversationId}/messages`, {
      content: content,
      type: "text",
    });

    // Extract the created message from response
    const createdMessage = response.data;

    res.json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: createdMessage.id || `msg-${Date.now()}`,
        patientId: patientId,
        content: content,
        timestamp: new Date().toISOString(),
        isFromPatient: false,
        sender: "Doctor",
      },
    });
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; statusText?: string; data?: unknown } };
    console.error("Error sending message via Spruce API:", {
      message: getSpruceErrorMessage(error),
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
    });

    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: getSpruceErrorMessage(error),
    });
  }
});
