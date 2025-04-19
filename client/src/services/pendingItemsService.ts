import { apiRequest } from "@/lib/queryClient";
import { SpruceMessage } from "./spruceApi";

export interface PendingItem {
  id: string;
  type: 'test' | 'imaging' | 'bloodwork' | 'referral' | 'other';
  description: string;
  requestedDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  patientId: number;
}

/**
 * Service for analyzing patient messages to detect pending medical items
 */
export const pendingItemsService = {
  /**
   * Analyze messages to detect pending items
   */
  async analyzePendingItems(patientId: number, messages: SpruceMessage[]): Promise<PendingItem[]> {
    try {
      const response = await apiRequest(
        "POST",
        "/api/pending-items/analyze",
        { patientId, messages }
      );
      
      return await response.json();
    } catch (error) {
      console.error("Error analyzing pending items:", error);
      return [];
    }
  },

  /**
   * Get all pending items for a patient
   */
  async getPendingItems(patientId: number): Promise<PendingItem[]> {
    try {
      const response = await apiRequest("GET", `/api/patients/${patientId}/pending-items`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching pending items:", error);
      return [];
    }
  },

  /**
   * Mark a pending item as completed
   */
  async markItemCompleted(itemId: string): Promise<PendingItem> {
    try {
      const response = await apiRequest(
        "PATCH",
        `/api/pending-items/${itemId}`,
        { status: "completed" }
      );
      
      return await response.json();
    } catch (error) {
      console.error("Error marking item completed:", error);
      throw error;
    }
  },

  /**
   * Follow up on a pending item by sending a message
   */
  async followUpOnItem(patientId: number, itemId: string): Promise<void> {
    try {
      await apiRequest(
        "POST",
        "/api/pending-items/follow-up",
        { patientId, itemId }
      );
    } catch (error) {
      console.error("Error following up on item:", error);
      throw error;
    }
  }
};