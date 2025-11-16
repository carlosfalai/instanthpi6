const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// Spruce API configuration
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

// Supabase client
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Mock messages for demonstration - in production, these would come from Spruce API
const mockMessages = {
  t_2B0EF7IFVUG00: [
    // Carlos Faviel Font
    {
      id: "msg_001",
      content: "Bonjour Dr. Font, j'ai besoin d'un renouvellement de mon ordonnance de metformine.",
      timestamp: "2024-12-30T04:15:00Z",
      isFromPatient: true,
      senderName: "Carlos Faviel Font",
    },
    {
      id: "msg_002",
      content: "Bien sûr, je vais préparer le renouvellement. Avez-vous des effets secondaires?",
      timestamp: "2024-12-30T04:18:00Z",
      isFromPatient: false,
      senderName: "Dr. Font",
    },
    {
      id: "msg_003",
      content: "Non, tout va bien. Merci docteur!",
      timestamp: "2024-12-30T04:20:00Z",
      isFromPatient: true,
      senderName: "Carlos Faviel Font",
    },
  ],
  t_2B0E2OAUVUG00: [
    // Team Spruce
    {
      id: "msg_team_001",
      content: "Welcome to Spruce Health! Your secure messaging platform is now active.",
      timestamp: "2024-08-12T21:35:00Z",
      isFromPatient: false,
      senderName: "Team Spruce",
    },
    {
      id: "msg_team_002",
      content: "You can now communicate securely with your patients through this platform.",
      timestamp: "2024-08-12T21:36:00Z",
      isFromPatient: false,
      senderName: "Team Spruce",
    },
  ],
  t_2B0E2OA187O00: [
    // Centre Médical Font
    {
      id: "msg_004",
      content: "Welcome to Centre Médical Font secure messaging.",
      timestamp: "2024-08-12T21:30:00Z",
      isFromPatient: false,
      senderName: "System",
    },
  ],
  t_2B0E2OAUVUG00: [
    // Team Spruce
    {
      id: "msg_005",
      content: "Your Spruce Health account has been set up successfully.",
      timestamp: "2024-08-12T21:35:00Z",
      isFromPatient: false,
      senderName: "Spruce Team",
    },
  ],
};

// Generate realistic mock messages for other conversations
function generateMockMessages(conversationId, patientName) {
  const templates = [
    {
      patient: "J'ai des douleurs au dos depuis quelques jours.",
      doctor: "Je vais vous prescrire des anti-inflammatoires. Prenez du repos.",
    },
    {
      patient: "Mon fils a de la fièvre depuis hier soir.",
      doctor: "Surveillez sa température. Si elle dépasse 39°C, allez aux urgences.",
    },
    {
      patient: "J'ai besoin de renouveler mes médicaments pour la tension.",
      doctor: "Je prépare le renouvellement. Passez le chercher à la pharmacie demain.",
    },
    {
      patient: "Est-ce que je peux avoir un rendez-vous cette semaine?",
      doctor: "J'ai une disponibilité jeudi à 14h30. Ça vous convient?",
    },
  ];

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  const baseTime = new Date("2024-08-16T10:00:00Z");

  return [
    {
      id: `msg_${conversationId}_1`,
      content: randomTemplate.patient,
      timestamp: new Date(baseTime.getTime() + 0).toISOString(),
      isFromPatient: true,
      senderName: patientName || "Patient",
    },
    {
      id: `msg_${conversationId}_2`,
      content: randomTemplate.doctor,
      timestamp: new Date(baseTime.getTime() + 300000).toISOString(), // 5 minutes later
      isFromPatient: false,
      senderName: "Dr. Font",
    },
    {
      id: `msg_${conversationId}_3`,
      content: "Merci docteur!",
      timestamp: new Date(baseTime.getTime() + 600000).toISOString(), // 10 minutes later
      isFromPatient: true,
      senderName: patientName || "Patient",
    },
  ];
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

  // Extract conversation ID from path
  // Path format: /api/spruce/conversations/{id}/history
  const pathParts = event.path.split("/").filter(p => p);
  let conversationId = null;
  
  // Find the conversation ID (should be before "history")
  const historyIndex = pathParts.indexOf("history");
  if (historyIndex > 0) {
    conversationId = pathParts[historyIndex - 1];
  } else {
    // Fallback: try last part if no "history" found
    conversationId = pathParts[pathParts.length - 1];
  }

  if (!conversationId || conversationId === "history" || conversationId === "conversations") {
    console.error("Invalid conversation ID from path:", event.path, "parts:", pathParts);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: "Conversation ID is required",
        path: event.path,
        parts: pathParts
      }),
    };
  }

  try {
    console.log(`Fetching message history for conversation ${conversationId}...`);

    // 1) Load doctor credentials from Supabase
    const doctorId = "default-doctor";
    let spruceAccessId = null;
    let spruceApiKey = null;

    const supabase = getSupabase();
    if (supabase) {
      const { data: physician, error: physicianErr } = await supabase
        .from("physicians")
        .select("spruce_access_id, spruce_api_key")
        .eq("id", doctorId)
        .single();

      if (physicianErr) {
        console.error("Supabase physicians read error:", physicianErr);
      }

      spruceAccessId = physician?.spruce_access_id;
      spruceApiKey = physician?.spruce_api_key;
    }

    // Fallback to headers if provided
    if (!spruceAccessId && (event.headers["x-spruce-access-id"] || event.headers["X-Spruce-Access-Id"])) {
      spruceAccessId = event.headers["x-spruce-access-id"] || event.headers["X-Spruce-Access-Id"]; 
    }
    if (!spruceApiKey && (event.headers["x-spruce-api-key"] || event.headers["X-Spruce-Api-Key"])) {
      spruceApiKey = event.headers["x-spruce-api-key"] || event.headers["X-Spruce-Api-Key"]; 
    }

    if (!spruceAccessId || !spruceApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Spruce credentials not configured",
          message: "Please add Spruce Access ID and API Key in Doctor Profile → API Integrations, then try again.",
        }),
      };
    }

    // Build Basic auth token from aid:api_key per Spruce API
    const basicToken = /^YWlk/.test(spruceApiKey)
      ? spruceApiKey
      : Buffer.from(`${spruceAccessId}:${spruceApiKey}`).toString("base64");

    // Fetch real messages from Spruce API
    try {
      const messagesResponse = await axios.get(
        `${SPRUCE_API_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Basic ${basicToken}`,
            Accept: "application/json",
          },
          params: {
            limit: 100, // Fetch up to 100 messages
          },
        }
      );

      const spruceMessages = messagesResponse.data.messages || messagesResponse.data || [];
      
      // Transform Spruce messages to inbox format
      const transformedMessages = spruceMessages.map((msg: any) => {
        // Determine if message is from patient (external participant)
        const isFromPatient = msg.sender?.type === "external" || 
                             msg.sender?.isExternal === true ||
                             !msg.sender?.isInternal;

        return {
          id: msg.id || msg.messageId,
          content: msg.content || msg.text || msg.body || "",
          timestamp: msg.timestamp || msg.createdAt || msg.sentAt || new Date().toISOString(),
          isFromPatient: isFromPatient,
          senderName: msg.sender?.displayName || msg.sender?.name || (isFromPatient ? "Patient" : "Dr. Font"),
        };
      });

      // Sort by timestamp (oldest first)
      transformedMessages.sort((a: any, b: any) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      console.log(`Fetched ${transformedMessages.length} messages for conversation ${conversationId}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(transformedMessages),
      };
    } catch (spruceError: any) {
      console.error("Error fetching messages from Spruce API:", spruceError.response?.data || spruceError.message);
      
      // Fallback to mock messages if Spruce API fails
      console.log("Falling back to mock messages");
      let messages = mockMessages[conversationId];
      if (!messages) {
        messages = generateMockMessages(conversationId, "Patient");
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(messages),
      };
    }
  } catch (error: any) {
    console.error("Error fetching message history:", error.message);

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch message history",
        message: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }),
    };
  }
};
