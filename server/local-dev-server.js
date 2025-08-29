import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Spruce API configuration
const SPRUCE_BEARER_TOKEN =
  process.env.SPRUCE_BEARER_TOKEN ||
  "YWlkX0x4WEZaNXBCYktwTU1KbjA3a0hHU2Q0d0UrST06c2tfVkNxZGxFWWNtSHFhcjN1TGs3NkZQa2ZoWm9JSEsyVy80bTVJRUpSQWhCY25lSEpPV3hqd2JBPT0=";
const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

// Mock messages for demonstration
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

// Route to get all conversations with pagination
app.get("/api/spruce/conversations/all", async (req, res) => {
  try {
    console.log("Fetching all conversations from Spruce API...");

    let allConversations = [];
    let hasMore = true;
    let paginationToken = null;
    let pageCount = 0;
    const maxPages = 10;

    while (hasMore && pageCount < maxPages) {
      const params = {
        orderBy: "lastActivity",
        limit: 200,
      };

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

      const data = response.data;
      const conversations = data.conversations || [];

      console.log(`Page ${pageCount + 1}: Retrieved ${conversations.length} conversations`);
      allConversations = allConversations.concat(conversations);

      hasMore = !!data.paginationToken;
      paginationToken = data.paginationToken;
      pageCount++;
    }

    console.log(`Total conversations retrieved: ${allConversations.length}`);
    res.json(allConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch conversations",
      message: error.message,
    });
  }
});

// Route to get conversation message history
app.get("/api/spruce/conversation/history/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required" });
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

    res.json(messages);
  } catch (error) {
    console.error("Error fetching message history:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch message history",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Local development server running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("- GET /api/spruce/conversations/all");
  console.log("- GET /api/spruce/conversation/history/:conversationId");
});
