// server/spruce-health-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
  message_type: 'text' | 'image' | 'file';
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
      baseUrl: 'https://api.sprucehealth.com/v1',
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SpruceHealthClient/1.0'
      },
      timeout: 30000
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
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
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
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    
    if (remaining) this.rateLimitRemaining = parseInt(remaining);
    if (reset) this.rateLimitReset = new Date(parseInt(reset) * 1000);
  }

  private shouldRetry(config: AxiosRequestConfig & { __retryCount?: number }): boolean {
    const retryCount = config.__retryCount || 0;
    return retryCount < (this.config.maxRetries || 3);
  }

  private async retryRequest(config: AxiosRequestConfig & { __retryCount?: number }): Promise<AxiosResponse> {
    config.__retryCount = (config.__retryCount || 0) + 1;
    const delay = this.config.retryDelay! * Math.pow(2, config.__retryCount - 1);
    
    await this.sleep(delay);
    return this.client.request(config);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(`Spruce API Error (${status}): ${data?.message || data?.error || 'Unknown error'}`);
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
        orderBy: 'lastMessageAt',
        orderDirection: 'desc',
        perPage: 20,
        page: 1,
        ...params
      };
      const response = await this.client.get('/conversations', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
  async getMessages(conversationId: string, params?: {
    page?: number;
    per_page?: number;
    since?: string;
  }): Promise<MessageListResponse> {
    try {
      // Get the conversation details to extract messages
      const response = await this.client.get(`/conversations/${conversationId}`, { params });
      const conversation = response.data;
      
      // Extract messages from the conversation object
      const messages = conversation.messages || [];
      
      return {
        messages: messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content || msg.text || "Message content not available",
          sent_at: msg.sent_at || msg.created_at || new Date().toISOString(),
          sender_id: msg.sender_id || msg.from || "unknown",
          sender_name: msg.sender_name || msg.from_name || "Unknown"
        })),
        pagination: {
          page: params?.page || 1,
          per_page: params?.per_page || 50,
          total: messages.length,
          total_pages: Math.ceil(messages.length / (params?.per_page || 50))
        }
      };
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      // Return empty messages with proper structure
      return {
        messages: [],
        pagination: {
          page: params?.page || 1,
          per_page: params?.per_page || 50,
          total: 0,
          total_pages: 0
        }
      };
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<Message> {
    try {
      const response = await this.client.post(`/conversations/${conversationId}/messages`, {
        content,
        message_type: messageType
      });
      return response.data;
    } catch (error) {
      console.error(`Error sending message to conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Create a webhook subscription
   */
  async createWebhook(url: string, events: string[] = ['message.created', 'conversation.created', 'conversation.updated']): Promise<any> {
    try {
      const response = await this.client.post('/webhooks', {
        url,
        events,
        active: true
      });
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  /**
   * List existing webhooks
   */
  async listWebhooks(): Promise<any> {
    try {
      const response = await this.client.get('/webhooks');
      return response.data;
    } catch (error) {
      console.error('Error listing webhooks:', error);
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
        message_ids: messageIds
      });
    } catch (error) {
      console.error(`Error marking messages as read in conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Get all conversations with their latest messages (convenience method)
   */
  async getConversationsWithLatestMessages(): Promise<(Conversation & { latest_message?: Message })[]> {
    try {
      const conversationsResponse = await this.getConversations();
      const conversationsWithMessages = await Promise.all(
        conversationsResponse.conversations.map(async (conversation) => {
          try {
            const messagesResponse = await this.getMessages(conversation.id, { per_page: 1 });
            return {
              ...conversation,
              latest_message: messagesResponse.messages[0] || undefined
            };
          } catch (error) {
            console.warn(`Could not fetch messages for conversation ${conversation.id}:`, error);
            return conversation;
          }
        })
      );
      
      return conversationsWithMessages;
    } catch (error) {
      console.error('Error fetching conversations with latest messages:', error);
      throw error;
    }
  }

  /**
   * Search conversations by participant name or email
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const allConversations = await this.getConversations();
      return allConversations.conversations.filter(conversation =>
        conversation.participants.some(participant =>
          participant.name.toLowerCase().includes(query.toLowerCase()) ||
          participant.email?.toLowerCase().includes(query.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
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
  MessageListResponse
};