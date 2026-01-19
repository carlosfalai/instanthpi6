import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const SPRUCE_API_URL = "https://api.sprucehealth.com/v1";

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const CACHE_FILE = path.join(__dirname, 'conversations_cache.json');
const MESSAGES_CACHE_DIR = path.join(__dirname, 'messages_cache');

if (!fs.existsSync(MESSAGES_CACHE_DIR)) {
    fs.mkdirSync(MESSAGES_CACHE_DIR);
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder-key-for-development',
});
let cachedConversations = [];
if (fs.existsSync(CACHE_FILE)) {
    try {
        cachedConversations = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        console.log(`Loaded ${cachedConversations.length} conversations from cache.`);
    } catch (e) {
        console.error("Failed to load cache:", e.message);
    }
}

/**
 * Fetch all conversations from Spruce and update cache
 */
async function syncConversations() {
    const spruceAccessId = process.env.SPRUCE_ACCESS_ID;
    const spruceApiKey = process.env.SPRUCE_API_KEY;

    if (!spruceAccessId || !spruceApiKey) {
        throw new Error('Spruce credentials not found');
    }

    console.log("Starting full sync...");
    let allConversations = [];
    let paginationToken = null;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 100) { // Limit to 100 pages (20k conversations max)
        const basicToken = /^YWlk/.test(spruceApiKey) ? spruceApiKey : Buffer.from(`${spruceAccessId}:${spruceApiKey}`).toString("base64");
        const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
            headers: { Authorization: `Basic ${basicToken}` },
            params: { orderBy: "lastActivity", limit: 200, paginationToken }
        });

        const chunk = response.data.conversations || [];
        allConversations = allConversations.concat(chunk);

        hasMore = response.data.hasMore;
        paginationToken = response.data.paginationToken || response.data.nextPageToken;
        pageCount++;
        console.log(`Synced page ${pageCount} (${allConversations.length} total)`);
        if (!paginationToken) break;
    }

    const transformed = allConversations.map(conv => {
        const timestamp = conv.lastMessageAt ||
            conv.lastActivity ||
            conv.lastMessage?.sentAt ||
            conv.updatedAt ||
            conv.createdAt ||
            new Date().toISOString();

        return {
            id: conv.id,
            patient_name: conv.externalParticipants?.[0]?.displayName || conv.title || "Unknown",
            last_message: conv.lastMessage?.content || conv.subtitle || "No messages",
            updated_at: timestamp,
            unread_count: conv.unreadCount || 0,
            archived: conv.archived || false
        };
    });

    cachedConversations = transformed;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(transformed, null, 2));
    console.log(`Sync complete. Saved ${transformed.length} records.`);
    return transformed;
}

/**
 * API: Get conversations (fast, from cache)
 */
app.get('/api/conversations', async (req, res) => {
    try {
        if (cachedConversations.length === 0) {
            console.log("Cache empty, performing initial sync...");
            await syncConversations();
        }
        res.json(cachedConversations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
    }
});

/**
 * API: Sync conversations (manual trigger)
 */
app.post('/api/sync', async (req, res) => {
    try {
        const data = await syncConversations();
        res.json({ success: true, count: data.length });
    } catch (error) {
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

/**
 * API: Fetch only recent updates (simulating webhooks)
 */
app.get('/api/updates', async (req, res) => {
    try {
        const { since } = req.query; // ISO timestamp
        const spruceBearerToken = process.env.SPRUCE_BEARER_TOKEN || process.env.SPRUCE_API_KEY;

        // Fetch only first page to find latest
        const response = await axios.get(`${SPRUCE_API_URL}/conversations`, {
            headers: { Authorization: `Bearer ${spruceBearerToken}` },
            params: { limit: 20 }
        });

        const conversations = response.data.conversations || [];
        const newOnes = since
            ? conversations.filter(c => new Date(c.lastActivity || c.updatedAt) > new Date(since))
            : conversations;

        // If new ones found, update cache
        if (newOnes.length > 0) {
            newOnes.forEach(newConv => {
                const idx = cachedConversations.findIndex(c => c.id === newConv.id);
                if (idx !== -1) {
                    cachedConversations[idx] = { ...cachedConversations[idx], ...newConv };
                } else {
                    cachedConversations.unshift(newConv);
                }
            });
            fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedConversations, null, 2));
        }

        res.json({ count: newOnes.length, conversations: newOnes });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

/**
 * Fetch FULL history for a conversation (with caching)
 */
app.get('/api/history/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const cachePath = path.join(MESSAGES_CACHE_DIR, `${conversationId}.json`);

        // 1. Check message cache
        if (fs.existsSync(cachePath)) {
            const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            // If cache is fresh (less than 5 mins), return it
            if (Date.now() - cache.lastFetched < 300000) {
                return res.json(cache.messages);
            }
        }

        const spruceBearerToken = process.env.SPRUCE_BEARER_TOKEN || process.env.SPRUCE_API_KEY;
        const spruceAccessId = process.env.SPRUCE_ACCESS_ID;
        const spruceApiKey = process.env.SPRUCE_API_KEY;

        console.log(`Fetching history for ${conversationId}...`);

        let allItems = [];
        let paginationToken = null;
        let hasMore = true;
        let attemptCount = 0;

        const bearerHeader = { Authorization: `Bearer ${spruceBearerToken}` };
        const basicToken = /^YWlk/.test(spruceApiKey) ? spruceApiKey : Buffer.from(`${spruceAccessId}:${spruceApiKey}`).toString("base64");
        const basicHeader = { Authorization: `Basic ${basicToken}` };

        try {
            while (hasMore && attemptCount < 20) {
                const response = await axios.get(`${SPRUCE_API_URL}/conversations/${conversationId}/items`, {
                    headers: bearerHeader,
                    params: { limit: 100, paginationToken }
                });

                const chunk = response.data.conversationItems || response.data.items || [];
                allItems = allItems.concat(chunk);
                hasMore = response.data.hasMore || false;
                paginationToken = response.data.paginationToken || response.data.nextPageToken;
                attemptCount++;
                if (!paginationToken || chunk.length === 0) break;
            }
        } catch (e) {
            console.log(`Items endpoint failed for ${conversationId}, trying /messages...`);
        }

        if (allItems.length === 0) {
            try {
                const msgResponse = await axios.get(`${SPRUCE_API_URL}/conversations/${conversationId}/messages`, {
                    headers: basicHeader,
                    params: { limit: 100 }
                });
                const messages = msgResponse.data.messages || msgResponse.data.data || [];
                // Process messages and attachments
                const history = [];
                messages.forEach(item => {
                    if (item.type === 'message') {
                        const attachments = item.message.attachments || [];
                        const media = attachments.filter(a => a.contentType && a.contentType.startsWith('image/')).map(a => a.url);

                        history.push({
                            id: item.id,
                            sender: item.message.senderName || 'Patient',
                            text: item.message.body,
                            timestamp: item.message.sentAt,
                            isInternal: item.message.isInternal,
                            media: media.length > 0 ? media : null
                        });
                    } else if (item.type === 'attachment') {
                        if (item.attachment && item.attachment.contentType && item.attachment.contentType.startsWith('image/')) {
                            history.push({
                                id: item.id,
                                sender: 'Media',
                                text: '[Photo]',
                                timestamp: item.createdAt,
                                media: [item.attachment.url]
                            });
                        }
                    } else {
                        // For other item types not explicitly handled, add them as-is or with a generic representation
                        history.push({
                            id: item.id,
                            content: item.text || item.content || item.body || (item.event ? `[${item.event.type}]` : "Media/Event"),
                            timestamp: item.createdAt || item.timestamp || item.sent_at || new Date().toISOString(),
                            senderName: item.author?.displayName || item.sender_name || (item.direction === 'inbound' || item.is_from_patient ? "Patient" : "Doctor"),
                            isFromPatient: item.direction === 'inbound' || item.is_from_patient || false,
                            isInternalNote: item.isInternalNote || item.type === 'note' || false,
                            type: item.object || item.type || "message"
                        });
                    }
                });
                allItems = history; // Replace allItems with the processed history
            } catch (e) {
                console.log(`Fallback messages endpoint also failed.`);
            }
        }

        const transformed = allItems.map(item => ({
            id: item.id,
            content: item.text || item.content || item.body || (item.event ? `[${item.event.type}]` : "Media/Event"),
            timestamp: item.createdAt || item.timestamp || item.sent_at || new Date().toISOString(),
            senderName: item.author?.displayName || item.sender_name || (item.direction === 'inbound' || item.is_from_patient ? "Patient" : "Doctor"),
            isFromPatient: item.direction === 'inbound' || item.is_from_patient || false,
            isInternalNote: item.isInternalNote || item.type === 'note' || false,
            type: item.object || item.type || "message",
            media: item.media || null // Add media field
        }));

        transformed.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Update lastMessageAt in conversation cache for "Live Chronology"
        if (transformed.length > 0) {
            const latestMsg = transformed[transformed.length - 1];
            const convIndex = cachedConversations.findIndex(c => c.id === conversationId);
            if (convIndex !== -1) {
                cachedConversations[convIndex].updated_at = latestMsg.timestamp;
                cachedConversations[convIndex].last_message = latestMsg.content;
                fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedConversations, null, 2));
            }
        }

        // Save to cache
        fs.writeFileSync(cachePath, JSON.stringify({
            lastFetched: Date.now(),
            messages: transformed
        }, null, 2));

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }
});

/**
 * API: Interaction with Claude 3.5 Haiku
 */
app.post('/api/ai', async (req, res) => {
    try {
        const { message, history } = req.body;

        console.log("Calling Claude Opus 4.5...");
        const response = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 4000,
            messages: [
                { role: "user", content: message }
            ],
            system: `You are Claude Opus 4.5, a clinical AI integrated into the Spruce viewer.
                     Your tone is spartan, natural, and highly professional.

                     STRICT FORMATTING RULES:
                     - NEVER use machine-like formatting (dashes, bullet points, asterisks) in messages directed to patients.
                     - Use natural, fluid paragraphs for patient explanations.
                     - For SOAP notes, do NOT use "S/A/P" headers if the user requests a natural style, but follow the structured styles below.

                     YOU MUST INTERNALIZE THESE STYLES & TEMPLATES:

                     1. SOAP STYLE (Gastro): Female 27y, Poke Bowl case style. Professional, detailed, focuses on hygiene/hydration.
                     2. SOAP STYLE (Chronic Cough): Post-infectious, stepwise treatment (Azithromycin/Ventolin).
                     3. SOAP STYLE (Class 4B): Professional driving license applications.
                     4. SOAP STYLE (Recurrent UTI): Ciprofloxacine BID x 5d style.
                     5. SOAP STYLE (ITSS): Preventive screening requests with specific lab markers.

                     6. ARRÊT DE TRAVAIL (Medical Leave):
                        - Short term (3 days) for gastro.
                        - Long term (2-4 weeks) for psych recovery (soutien adapté, psychothérapie).

                     7. PATIENT MESSAGES:
                        - Explain the clinical case briefly in simple terms.
                        - Explain the mechanism of prescribed meds (how it works, why it helps).
                        - Provide practical instructions (avoid coffee/alcohol, sleep elevated).
                        - Example style: "Je vous prescris le Dymista... pour dégager les sinus... Le Gelomyrtol fluidifie le mucus... dormez avec la tête légèrement surélevée."

                     8. CLINICAL CASE STRATEGY (ASCII Timeline):
                        - If asked for a timeline, use emojis: 🗓️ 14 Oct ➔ 🤢 Vomit ➔ 💧 Hydrate.
                        - Strategy follows: Symptoms, Red Flags, Labs, Imaging, Treatment, Follow-up.

                     9. REQUISITIONS & REF:
                        - Detailed indications for Ultrasounds (Lithiasis), MRI, and Surgery referrals.

                     10. PRIVACY & SAFETY:
                        - NEVER SEND MESSAGES TO ANY PATIENT EXCEPT: Carlos Faviel Font (514-497-2324).
                        - For any other patient, draft the content BUT NEVER trigger a send action.
                        - Always prioritize clinical safety.`
        });

        res.json({ response: response.content[0].text });
    } catch (error) {
        console.error("Claude API Error:", error.message);
        res.status(500).json({ error: 'AI Error', details: error.message });
    }
});

app.post('/api/archive/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const spruceBearerToken = process.env.SPRUCE_BEARER_TOKEN || process.env.SPRUCE_API_KEY;
        await axios.patch(`${SPRUCE_API_URL}/conversations/${conversationId}`, { archived: true }, {
            headers: { Authorization: `Bearer ${spruceBearerToken}`, 'Content-Type': 'application/json' }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Archive failed', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Viewer: http://localhost:${PORT}`));
