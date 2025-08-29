import axios from "axios";

/**
 * Service for interacting with the Spruce Health API
 */
const spruceClient = axios.create({
  baseURL: "/api/spruce",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface SpruceMessage {
  id: string;
  patientId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  sender?: string;
  attachmentUrl?: string;
  spruceMessageId: string;
}

export interface SprucePatient {
  id: number;
  name: string;
  spruceId: string;
  avatarUrl?: string;
  lastActive?: string;
}

export interface SpruceConversation {
  patientId: number;
  patientName: string;
  spruceId: string;
  avatarUrl?: string;
  lastActive?: string;
  hasUnread: boolean;
  lastMessage?: {
    content: string;
    timestamp: string;
    isFromPatient: boolean;
  };
}

/**
 * Fetch conversations from Spruce API
 */
export async function fetchSpruceConversations(): Promise<SpruceConversation[]> {
  const response = await spruceClient.get("/conversations");
  return response.data;
}

/**
 * Fetch messages for a specific patient from Spruce API
 */
export async function fetchSpruceMessages(patientId: number): Promise<SpruceMessage[]> {
  const response = await spruceClient.get(`/patients/${patientId}/messages`);
  return response.data;
}

/**
 * Send a message to a patient via Spruce API
 */
export async function sendSpruceMessage(
  patientId: number,
  content: string,
  attachmentUrl?: string
): Promise<SpruceMessage> {
  const response = await spruceClient.post(`/patients/${patientId}/messages`, {
    content,
    attachmentUrl,
  });
  return response.data;
}

/**
 * Mark a conversation as read in Spruce API
 */
export async function markSpruceConversationAsRead(patientId: number): Promise<void> {
  await spruceClient.post(`/patients/${patientId}/read`);
}

/**
 * Mark a conversation as archived/resolved in Spruce API
 */
export async function archiveSpruceConversation(patientId: number): Promise<void> {
  await spruceClient.post(`/patients/${patientId}/archive`);
}

export default {
  fetchSpruceConversations,
  fetchSpruceMessages,
  sendSpruceMessage,
  markSpruceConversationAsRead,
  archiveSpruceConversation,
};
