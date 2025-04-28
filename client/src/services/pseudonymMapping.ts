import { apiRequest } from '@/lib/queryClient';

/**
 * Service for managing mappings between patient pseudonyms and their chat conversations
 */
export interface PseudonymLink {
  pseudonym: string;
  patientId: number;
  patientName: string;
  messageId?: number; // Message ID where the patient mentioned their pseudonym
  timestamp: string;
}

export const pseudonymMappingService = {
  /**
   * Retrieves all known pseudonym-patient links
   */
  async getPseudonymLinks(): Promise<PseudonymLink[]> {
    try {
      const response = await apiRequest('GET', '/api/pseudonym-links');
      return await response.json();
    } catch (error) {
      console.error('Error fetching pseudonym links:', error);
      return [];
    }
  },

  /**
   * Finds links for a specific pseudonym
   */
  async findLinksByPseudonym(pseudonym: string): Promise<PseudonymLink[]> {
    try {
      const response = await apiRequest('GET', `/api/pseudonym-links/by-pseudonym/${encodeURIComponent(pseudonym)}`);
      return await response.json();
    } catch (error) {
      console.error(`Error finding links for pseudonym ${pseudonym}:`, error);
      return [];
    }
  },

  /**
   * Finds links for a specific patient
   */
  async findLinksByPatientId(patientId: number): Promise<PseudonymLink[]> {
    try {
      const response = await apiRequest('GET', `/api/pseudonym-links/by-patient/${patientId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error finding links for patient ${patientId}:`, error);
      return [];
    }
  },

  /**
   * Creates a new pseudonym-patient link
   */
  async createPseudonymLink(link: Omit<PseudonymLink, 'timestamp'>): Promise<PseudonymLink> {
    try {
      const response = await apiRequest('POST', '/api/pseudonym-links', link);
      return await response.json();
    } catch (error) {
      console.error('Error creating pseudonym link:', error);
      throw error;
    }
  },
  
  /**
   * Deletes a pseudonym-patient link
   */
  async deletePseudonymLink(id: number): Promise<void> {
    try {
      await apiRequest('DELETE', `/api/pseudonym-links/${id}`);
    } catch (error) {
      console.error(`Error deleting pseudonym link with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Scans message content for potential pseudonym mentions
   * This is a client-side utility to help detect pseudonyms in messages
   */
  detectPseudonymInText(text: string): string | null {
    // Patterns that may indicate a pseudonym
    // Looking for patterns like "847 Ancient Meadows" or similar
    const patterns = [
      // Pattern: 3 digits followed by words (e.g., "847 Ancient Meadows")
      /\b(\d{2,4}\s+[A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
      
      // Pattern: Number + adjective + noun
      /\b(\d+\s+[A-Z][a-z]+\s+[A-Z][a-z]+s?)\b/g,
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first match
        return matches[0];
      }
    }

    return null;
  }
};

export default pseudonymMappingService;