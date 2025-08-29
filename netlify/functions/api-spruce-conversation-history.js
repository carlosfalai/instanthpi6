const axios = require("axios");

// Spruce API configuration
const SPRUCE_BEARER_TOKEN =
  process.env.SPRUCE_BEARER_TOKEN ||
  "YWlkX0x4WEZaNXBCYktwTU1KbjA3a0hHU2Q0d0UrST06c2tfVkNxZGxFWWNtSHFhcjN1TGs3NkZQa2ZoWm9JSEsyVy80bTVJRUpSQWhCY25lSEpPV3hqd2JBPT0=";
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

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
  const pathParts = event.path.split("/");
  const conversationId = pathParts[pathParts.length - 1];

  if (!conversationId || conversationId === "history") {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Conversation ID is required" }),
    };
  }

  try {
    console.log(`Fetching message history for conversation ${conversationId}...`);

    // Check if we have mock messages for this conversation
    let messages = mockMessages[conversationId];

    if (!messages) {
      // Try to get conversation details from Spruce to get patient name
      try {
        const convResponse = await axios.get(`${SPRUCE_API_URL}/conversations/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${SPRUCE_BEARER_TOKEN}`,
            Accept: "application/json",
          },
        });

        const conversation = convResponse.data.conversation || convResponse.data;
        const patientName =
          conversation.title || conversation.externalParticipants?.[0]?.displayName || "Patient";

        // Generate mock messages for this conversation
        messages = generateMockMessages(conversationId, patientName);
      } catch (error) {
        console.log("Could not fetch conversation details, using generic messages");
        messages = generateMockMessages(conversationId, "Patient");
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(messages),
    };
  } catch (error) {
    console.error("Error fetching message history:", error.message);

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch message history",
        message: error.message,
      }),
    };
  }
};
