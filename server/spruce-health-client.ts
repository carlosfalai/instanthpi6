// server/spruce-health-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

interface SpruceHealthConfig {
  bearerToken: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface Conversation {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  lastMessageAt: string;
  externalParticipants?: Array<{
    contact: string;
    displayName: string;
  }>;
  unread_count?: number;
  archived?: boolean;
}

interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: "text" | "image" | "file";
  sent_at: string;
  read: boolean;
}

interface ConversationListResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

interface MessageListResponse {
  messages: Message[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

class SpruceHealthClient {
  private client: AxiosInstance;
  private config: SpruceHealthConfig;
  private rateLimitRemaining: number = 60;
  private rateLimitReset: Date = new Date();

  constructor(config: SpruceHealthConfig) {
    this.config = {
      baseUrl: "https://api.sprucehealth.com/v1",
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    const authHeader =
      this.config.bearerToken.startsWith("YWlk") || this.config.bearerToken.startsWith("aid_")
        ? `Basic ${this.config.bearerToken}`
        : `Bearer ${this.config.bearerToken}`;

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "User-Agent": "SpruceHealthClient/1.0",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        await this.checkRateLimit();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for rate limit tracking and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimitInfo(response);
        return response;
      },
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers["retry-after"] || "60");
          console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
          await this.sleep(retryAfter * 1000);
          return this.client.request(error.config);
        }

        if (error.response?.status >= 500 && this.shouldRetry(error.config)) {
          return this.retryRequest(error.config);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 1 && new Date() < this.rateLimitReset) {
      const waitTime = this.rateLimitReset.getTime() - Date.now();
      console.warn(`Rate limit nearly exhausted. Waiting ${waitTime}ms.`);
      await this.sleep(waitTime);
    }
  }

  private updateRateLimitInfo(response: AxiosResponse): void {
    const remaining = response.headers["x-ratelimit-remaining"];
    const reset = response.headers["x-ratelimit-reset"];

    if (remaining) this.rateLimitRemaining = parseInt(remaining);
    if (reset) this.rateLimitReset = new Date(parseInt(reset) * 1000);
  }

  private shouldRetry(config: AxiosRequestConfig & { __retryCount?: number }): boolean {
    const retryCount = config.__retryCount || 0;
    return retryCount < (this.config.maxRetries || 3);
  }

  private async retryRequest(
    config: AxiosRequestConfig & { __retryCount?: number }
  ): Promise<AxiosResponse> {
    config.__retryCount = (config.__retryCount || 0) + 1;
    const delay = this.config.retryDelay! * Math.pow(2, config.__retryCount - 1);

    await this.sleep(delay);
    return this.client.request(config);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(
        `Spruce API Error (${status}): ${data?.message || data?.error || "Unknown error"}`
      );
    }
    return new Error(`Network Error: ${error.message}`);
  }

  // Public API Methods

  /**
   * Get all conversations with optional filtering
   */
  async getConversations(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    participant_id?: string;
  }): Promise<ConversationListResponse> {
    try {
      const defaultParams = {
        orderBy: "lastMessageAt",
        orderDirection: "desc",
        perPage: 20,
        page: 1,
        ...params,
      };
      const response = await this.client.get("/conversations", { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await this.client.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages from a specific conversation
   */
  async getMessages(
    conversationId: string,
    params?: {
      page?: number;
      per_page?: number;
      since?: string;
    }
  ): Promise<MessageListResponse> {
    try {
      console.log(`Fetching messages for conversation ${conversationId} from Spruce API`);

      // Try different message endpoints based on Spruce API structure
      let response: any;
      let finalMessages: any[] = [];

      try {
        // Try the items endpoint which seems preferred in some versions
        response = await this.client.get(`/conversations/${conversationId}/items`, {
          params: {
            limit: params?.per_page || 50,
          },
        });
        console.log(`Items endpoint response:`, JSON.stringify(response.data, null, 2));
        finalMessages = response.data.conversationItems || response.data.items || [];
      } catch (itemsError: any) {
        console.log(`Items endpoint failed: ${itemsError.message}`);

        try {
          // Try the messages endpoint with proper parameters
          response = await this.client.get(`/conversations/${conversationId}/messages`, {
            params: {
              page: params?.page || 1,
              per_page: params?.per_page || 50,
              include: "all",
            },
          });
          console.log(`Messages endpoint response:`, JSON.stringify(response.data, null, 2));
          finalMessages = response.data.messages || response.data.data || [];
        } catch (messagesError: any) {
          console.log(
            `Direct messages endpoint failed (${messagesError.response?.status}): ${messagesError.message}`
          );

          // Get conversation details for context
          const convResponse = await this.client.get(`/conversations/${conversationId}`);
          console.log(`Conversation details:`, JSON.stringify(convResponse.data, null, 2));

          // Extract any embedded messages
          const conversation = convResponse.data.conversation || convResponse.data;
          finalMessages =
            conversation.recentMessages ||
            conversation.messages ||
            conversation.recent_messages ||
            [];
        }
      }

      console.log(`Found ${finalMessages.length} messages for conversation ${conversationId}`);

      return {
        messages: finalMessages.map((msg: any) => {
          // Extract text content or generate from attachments
          let content = msg.content || msg.text || msg.body || msg.message?.body;

          // If no text content, check for attachments
          if (!content && msg.attachments && msg.attachments.length > 0) {
            const attachmentDescriptions = msg.attachments
              .map((att: any) => {
                if (att.type === "visit" && att.title) {
                  return `[Visit: ${att.title}]`;
                }
                if (att.type === "image" || att.type === "photo") {
                  return "[Image attachment]";
                }
                if (att.type === "file" || att.type === "document") {
                  return `[File: ${att.title || att.filename || "attachment"}]`;
                }
                return `[${att.type || "Attachment"}: ${att.title || ""}]`;
              })
              .join(" ");
            content = attachmentDescriptions || "Message content not available";
          }

          return {
            id: msg.id || msg.messageId || `msg_${Date.now()}`,
            conversation_id: conversationId,
            content: content || "Message content not available",
            sent_at:
              msg.sentAt ||
              msg.sent_at ||
              msg.createdAt ||
              msg.created_at ||
              msg.timestamp ||
              new Date().toISOString(),
            sender_id: msg.authorId || msg.sender_id || msg.from || msg.sender || "unknown",
            sender_name:
              msg.author?.displayName ||
              msg.sender_name ||
              msg.from_name ||
              msg.display_name ||
              (msg.isFromPatient ? "Patient" : "Doctor"),
            message_type: msg.type || msg.message_type || "text",
            read: msg.read !== undefined ? msg.read : true,
          };
        }),
        pagination: {
          page: params?.page || 1,
          per_page: params?.per_page || 50,
          total: finalMessages.length,
          total_pages: Math.ceil(finalMessages.length / (params?.per_page || 50)),
        },
      };
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error("Error response:", axiosError.response?.data);
      }

      return {
        messages: [],
        pagination: {
          page: params?.page || 1,
          per_page: params?.per_page || 50,
          total: 0,
          total_pages: 0,
        },
      };
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: "text" | "image" | "file" = "text"
  ): Promise<Message> {
    try {
      // Try different message sending formats based on Spruce Health API documentation
      const messagePayload = {
        body: content,
        type: messageType,
      };

      console.log(
        `Sending message to conversation ${conversationId}:`,
        JSON.stringify(messagePayload)
      );

      // Try direct POST to conversations endpoint
      let response;
      try {
        response = await this.client.post(
          `/conversations/${conversationId}/messages`,
          messagePayload
        );
        console.log("Message sent successfully via conversations endpoint");
      } catch (directError: any) {
        console.log(
          `Direct conversations endpoint failed (${directError.response?.status}): ${directError.message}`
        );
        console.log("Error details:", directError.response?.data);

        // Try alternative sending format
        const altPayload = {
          content: content,
          message_type: messageType,
          conversation_id: conversationId,
        };

        try {
          response = await this.client.post(`/messages`, altPayload);
          console.log("Message sent successfully via messages endpoint");
        } catch (altError: any) {
          console.log(`Alternative messages endpoint failed: ${altError.message}`);
          throw altError;
        }
      }

      return response.data;
    } catch (error: any) {
      console.error(`Error sending message to conversation ${conversationId}:`, error);
      console.error("Final error response:", error.response?.data);
      throw error;
    }
  }

  /**
   * Create a webhook subscription
   */
  async createWebhook(
    url: string,
    events: string[] = ["message.created", "conversation.created", "conversation.updated"]
  ): Promise<any> {
    try {
      const response = await this.client.post("/webhooks", {
        url,
        events,
        active: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating webhook:", error);
      throw error;
    }
  }

  /**
   * List existing webhooks
   */
  async listWebhooks(): Promise<any> {
    try {
      const response = await this.client.get("/webhooks");
      return response.data;
    } catch (error) {
      console.error("Error listing webhooks:", error);
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.client.delete(`/webhooks/${webhookId}`);
    } catch (error) {
      console.error(`Error deleting webhook ${webhookId}:`, error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    try {
      await this.client.patch(`/conversations/${conversationId}/messages/read`, {
        message_ids: messageIds,
      });
    } catch (error) {
      console.error(`Error marking messages as read in conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Get all conversations with their latest messages (convenience method)
   */
  async getConversationsWithLatestMessages(): Promise<
    (Conversation & { latest_message?: Message })[]
  > {
    try {
      const conversationsResponse = await this.getConversations();
      const conversationsWithMessages = await Promise.all(
        conversationsResponse.conversations.map(async (conversation) => {
          try {
            const messagesResponse = await this.getMessages(conversation.id, { per_page: 1 });
            return {
              ...conversation,
              latest_message: messagesResponse.messages[0] || undefined,
            };
          } catch (error) {
            console.warn(`Could not fetch messages for conversation ${conversation.id}:`, error);
            return conversation;
          }
        })
      );

      return conversationsWithMessages;
    } catch (error) {
      console.error("Error fetching conversations with latest messages:", error);
      throw error;
    }
  }

  /**
   * Search conversations by participant name or title
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const allConversations = await this.getConversations();
      const lowerQuery = query.toLowerCase();
      return allConversations.conversations.filter((conversation) => {
        // Search in title
        if (conversation.title.toLowerCase().includes(lowerQuery)) return true;
        // Search in external participants
        return conversation.externalParticipants?.some(
          (participant) =>
            participant.displayName.toLowerCase().includes(lowerQuery) ||
            participant.contact?.toLowerCase().includes(lowerQuery)
        ) ?? false;
      });
    } catch (error) {
      console.error("Error searching conversations:", error);
      throw error;
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset,
    };
  }
}

export {
  SpruceHealthClient,
  SpruceHealthConfig,
  Conversation,
  Message,
  Participant,
  ConversationListResponse,
  MessageListResponse,
};
