import { apiRequest } from "@/lib/queryClient";

const SPRUCE_API_KEY = process.env.SPRUCE_API_KEY || process.env.VITE_SPRUCE_API_KEY || "";

export interface SpruceMessage {
  id: string;
  patientId: number;
  content: string;
  timestamp: string;
  isFromPatient: boolean;
  attachmentUrl?: string;
}

/**
 * Service for interacting with the Spruce Health API
 */
export const spruceApi = {
  /**
   * Fetch messages for a specific patient
   */
  async getPatientMessages(patientId: number): Promise<SpruceMessage[]> {
    try {
      const response = await apiRequest("GET", `/api/patients/${patientId}/messages`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching patient messages:", error);
      throw error;
    }
  },

  /**
   * Send a message to a patient
   */
  async sendMessage(
    patientId: number,
    content: string,
    messageType: string
  ): Promise<SpruceMessage> {
    try {
      const response = await apiRequest("POST", "/api/spruce/messages", {
        patientId,
        message: content,
        messageType,
      });

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },
};
