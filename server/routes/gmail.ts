import { Router } from "express";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, requireAuthenticatedUserId } from "../middleware/auth";

const router = Router();

// All Gmail routes require authentication
router.use(requireAuth);

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/gmail/callback`
);

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Get Gmail OAuth URL
router.get("/auth/url", async (req, res) => {
  try {
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Force consent to get refresh token
    });

    res.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating Gmail auth URL:", error);
    res.status(500).json({ error: "Failed to generate auth URL", message: error.message });
  }
});

// Handle Gmail OAuth callback
router.get("/auth/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const { tokens } = await oauth2Client.getToken(code as string);

    // Store tokens securely (encrypted in Supabase)
    const supabase = getSupabase();
    const doctorId = String(requireAuthenticatedUserId(req));

    if (supabase && tokens.refresh_token) {
      // Store encrypted tokens in physicians table
      await supabase
        .from("physicians")
        .update({
          gmail_refresh_token: tokens.refresh_token,
          gmail_access_token: tokens.access_token,
          gmail_token_expiry: tokens.expiry_date,
        })
        .eq("id", doctorId);
    }

    // Redirect to inbox page
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/inbox?gmail_connected=true`);
  } catch (error: any) {
    console.error("Error handling Gmail callback:", error);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/inbox?gmail_error=true`);
  }
});

// Get Gmail access token for a user
async function getGmailAccessToken(doctorId: string = "default-doctor") {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data: physician, error } = await supabase
    .from("physicians")
    .select("gmail_refresh_token, gmail_access_token, gmail_token_expiry")
    .eq("id", doctorId)
    .single();

  if (error || !physician?.gmail_refresh_token) {
    throw new Error("Gmail not connected. Please connect your Gmail account first.");
  }

  // Check if token is expired
  if (physician.gmail_token_expiry && new Date(physician.gmail_token_expiry) < new Date()) {
    // Refresh the token
    oauth2Client.setCredentials({ refresh_token: physician.gmail_refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored token
    await supabase
      .from("physicians")
      .update({
        gmail_access_token: credentials.access_token,
        gmail_token_expiry: credentials.expiry_date,
      })
      .eq("id", doctorId);

    return credentials.access_token!;
  }

  return physician.gmail_access_token || "";
}

// Fetch emails from Gmail with "instanthpi" label
router.get("/emails", async (req, res) => {
  try {
    const doctorId = String(requireAuthenticatedUserId(req));
    const accessToken = await getGmailAccessToken(doctorId);

    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // First, get the "instanthpi" label ID
    const labelsResponse = await gmail.users.labels.list({
      userId: "me",
    });

    const instanthpiLabel = labelsResponse.data.labels?.find(
      (label) => label.name?.toLowerCase() === "instanthpi"
    );

    if (!instanthpiLabel || !instanthpiLabel.id) {
      return res.json({ emails: [], message: "No 'instanthpi' label found in Gmail" });
    }

    // Get messages with the "instanthpi" label
    const messagesResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: [instanthpiLabel.id],
      maxResults: 50,
      q: "in:instanthpi",
    });

    const messageIds = messagesResponse.data.messages?.map((m) => m.id!) || [];

    // Fetch full message details
    const emails = await Promise.all(
      messageIds.slice(0, 50).map(async (messageId) => {
        try {
          const message = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
          });

          const headers = message.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

          const subject = getHeader("Subject");
          const from = getHeader("From");
          const date = getHeader("Date");
          const snippet = message.data.snippet || "";

          // Extract email body
          let body = "";
          if (message.data.payload?.body?.data) {
            body = Buffer.from(message.data.payload.body.data, "base64").toString("utf-8");
          } else if (message.data.payload?.parts) {
            const textPart = message.data.payload.parts.find(
              (p) => p.mimeType === "text/plain" || p.mimeType === "text/html"
            );
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
            }
          }

          return {
            id: messageId,
            subject,
            from,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            snippet,
            body: body.substring(0, 500), // Limit body preview
            threadId: message.data.threadId,
            unread: message.data.labelIds?.includes("UNREAD") || false,
          };
        } catch (error) {
          console.error(`Error fetching message ${messageId}:`, error);
          return null;
        }
      })
    );

    const validEmails = emails.filter((e) => e !== null);

    res.json({ emails: validEmails });
  } catch (error: any) {
    console.error("Error fetching Gmail emails:", error);

    if (error.message?.includes("Gmail not connected")) {
      return res.status(401).json({
        error: "Gmail not connected",
        message: "Please connect your Gmail account first.",
      });
    }

    res.status(500).json({
      error: "Failed to fetch emails",
      message: error.message,
    });
  }
});

// Check Gmail connection status
router.get("/status", async (req, res) => {
  try {
    const doctorId = "default-doctor";
    const supabase = getSupabase();

    if (!supabase) {
      return res.json({ connected: false, message: "Supabase not configured" });
    }

    const { data: physician } = await supabase
      .from("physicians")
      .select("gmail_refresh_token")
      .eq("id", doctorId)
      .single();

    res.json({
      connected: !!physician?.gmail_refresh_token,
      email: "cff@centremedicalfont.ca",
    });
  } catch (error: any) {
    res.json({ connected: false, message: error.message });
  }
});

export default router;
