const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.CLIENT_URL || "https://instanthpi.ca"}/auth/gmail/callback`
);

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Get Gmail access token for a user
async function getGmailAccessToken(doctorId = "default-doctor") {
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

    return credentials.access_token;
  }

  return physician.gmail_access_token || "";
}

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

  // Parse the path to determine which endpoint
  const pathParts = event.path.split("/").filter((p) => p);
  const endpoint = pathParts[pathParts.length - 1];
  const isAuthUrl = event.path.includes("/auth/url");
  const isAuthCallback = event.path.includes("/auth/callback");

  try {
    // Status endpoint: /api/gmail/status
    if (endpoint === "status" && event.httpMethod === "GET") {
      const doctorId = "default-doctor";
      const supabase = getSupabase();

      if (!supabase) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ connected: false, message: "Supabase not configured" }),
        };
      }

      const { data: physician } = await supabase
        .from("physicians")
        .select("gmail_refresh_token")
        .eq("id", doctorId)
        .single();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: !!physician?.gmail_refresh_token,
          email: "cff@centremedicalfont.ca",
        }),
      };
    }

    // Auth URL endpoint: /api/gmail/auth/url
    if (isAuthUrl && event.httpMethod === "GET") {
      // Validate that Google OAuth credentials are configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Gmail OAuth not configured",
            message:
              "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required. Please configure them in Netlify environment variables.",
            details: {
              hasClientId: !!process.env.GOOGLE_CLIENT_ID,
              hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            },
          }),
        };
      }

      const scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ];

      try {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: scopes,
          prompt: "consent",
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ authUrl }),
        };
      } catch (error) {
        console.error("Error generating Gmail auth URL:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Failed to generate auth URL",
            message: error.message || "An error occurred while generating the Gmail OAuth URL",
          }),
        };
      }
    }

    // Auth callback endpoint: /api/gmail/auth/callback
    if (isAuthCallback && event.httpMethod === "GET") {
      const { code } = event.queryStringParameters || {};

      if (!code) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Authorization code is required" }),
        };
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);

        // Store tokens securely in Supabase
        const supabase = getSupabase();
        const doctorId = "default-doctor";

        if (supabase && tokens.refresh_token) {
          await supabase
            .from("physicians")
            .update({
              gmail_refresh_token: tokens.refresh_token,
              gmail_access_token: tokens.access_token,
              gmail_token_expiry: tokens.expiry_date,
            })
            .eq("id", doctorId);
        }

        // Redirect to Gmail inbox page
        const clientUrl = process.env.CLIENT_URL || "https://instanthpi.ca";
        return {
          statusCode: 302,
          headers: {
            ...headers,
            Location: `${clientUrl}/gmail-inbox?gmail_connected=true`,
          },
          body: "",
        };
      } catch (error) {
        console.error("Error handling Gmail callback:", error);
        const clientUrl = process.env.CLIENT_URL || "https://instanthpi.ca";
        return {
          statusCode: 302,
          headers: {
            ...headers,
            Location: `${clientUrl}/gmail-inbox?gmail_error=true`,
          },
          body: "",
        };
      }
    }

    // Emails endpoint: /api/gmail/emails
    if (endpoint === "emails" && event.httpMethod === "GET") {
      const doctorId = "default-doctor";
      const accessToken = await getGmailAccessToken(doctorId);

      oauth2Client.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      // First, try to get the "instanthpi" label ID (case-insensitive)
      let labelFilter = null;
      try {
        const labelsResponse = await gmail.users.labels.list({
          userId: "me",
        });

        const instanthpiLabel = labelsResponse.data.labels?.find(
          (label) => label.name?.toLowerCase() === "instanthpi"
        );

        if (instanthpiLabel) {
          labelFilter = [instanthpiLabel.id];
          console.log(`Found Instanthpi label: ${instanthpiLabel.id}`);
        } else {
          console.log("No 'Instanthpi' label found, falling back to search query");
        }
      } catch (labelError) {
        console.error("Error fetching labels:", labelError);
      }

      // Get messages - either by label or search query
      let allMessageIds = [];
      let pageToken = null;
      let pageCount = 0;
      const maxPages = 10; // Fetch up to 10 pages (2000 emails)

      // Construct search query if label not found
      const query = labelFilter ? `label:instanthpi` : `subject:instanthpi OR from:instanthpi`;

      do {
        const params = {
          userId: "me",
          maxResults: 50, // Reduced batch size for better reliability
          pageToken: pageToken,
          q: query,
        };

        // Only add labelIds if we found the label
        if (labelFilter) {
          params.labelIds = labelFilter;
        }

        const messagesResponse = await gmail.users.messages.list(params);

        const messageIds = messagesResponse.data.messages?.map((m) => m.id) || [];
        allMessageIds = allMessageIds.concat(messageIds);
        pageToken = messagesResponse.data.nextPageToken;
        pageCount++;

        console.log(
          `Page ${pageCount}: Fetched ${messageIds.length} messages. Total: ${allMessageIds.length}`
        );

        if (!pageToken || pageCount >= maxPages) break;
      } while (pageToken);

      console.log(`Fetched total of ${allMessageIds.length} messages from Instanthpi folder`);

      // Fetch full message details (limit to 100 for performance)
      const emails = await Promise.all(
        allMessageIds.slice(0, 100).map(async (messageId) => {
          try {
            const message = await gmail.users.messages.get({
              userId: "me",
              id: messageId,
              format: "full",
            });

            const headers = message.data.payload?.headers || [];
            const getHeader = (name) =>
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
              body: body.substring(0, 2000), // Limit body preview
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

      // Sort by date (most recent first)
      validEmails.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ emails: validEmails }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Endpoint not found" }),
    };
  } catch (error) {
    console.error("Gmail API error:", error);

    if (error.message?.includes("Gmail not connected")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: "Gmail not connected",
          message: "Please connect your Gmail account first.",
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to process request",
        message: error.message,
      }),
    };
  }
};
