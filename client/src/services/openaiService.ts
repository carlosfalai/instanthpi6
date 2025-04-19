import { apiRequest } from '@/lib/queryClient';

export interface AIDocumentation {
  id: number;
  patientId: number;
  hpi: string; // History of Present Illness
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  prescription: {
    medication: string;
    dosage: string;
    instructions: string;
    dispense: string;
    refills: number;
  } | null;
  followUpQuestions: string[];
  createdAt: string;
  isApproved: boolean;
}

/**
 * Service for interacting with the OpenAI API for medical documentation
 */
export const openaiService = {
  /**
   * Generate AI documentation based on patient data
   */
  async generateDocumentation(
    patientId: number,
    formData: Record<string, any>,
    patientMessages?: any[]
  ): Promise<AIDocumentation> {
    try {
      const response = await apiRequest('POST', '/api/generate-documentation', {
        patientId,
        formData,
        patientMessages
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw error;
    }
  },

  /**
   * Get current AI documentation for a patient
   */
  async getDocumentation(patientId: number): Promise<AIDocumentation> {
    try {
      const response = await apiRequest('GET', `/api/patients/${patientId}/documentation`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching documentation:', error);
      throw error;
    }
  },

  /**
   * Update AI documentation
   */
  async updateDocumentation(
    id: number,
    updates: Partial<Omit<AIDocumentation, 'id' | 'patientId' | 'createdAt'>>
  ): Promise<AIDocumentation> {
    try {
      const response = await apiRequest('PATCH', `/api/documentation/${id}`, updates);
      return await response.json();
    } catch (error) {
      console.error('Error updating documentation:', error);
      throw error;
    }
  }
};
