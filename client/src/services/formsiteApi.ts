import { apiRequest } from '@/lib/queryClient';

const FORMSITE_API_KEY = process.env.FORMSITE_API_KEY || process.env.VITE_FORMSITE_API_KEY || '';

export interface FormSubmissionData {
  id: number;
  patientId: number;
  formType: 'urgent_care' | 'std_checkup';
  formData: Record<string, any>;
  submissionId: string;
  submittedAt: string;
}

/**
 * Service for interacting with the Formsite API
 */
export const formsiteApi = {
  /**
   * Fetch form submissions for a specific patient
   */
  async getPatientFormSubmissions(patientId: number): Promise<FormSubmissionData[]> {
    try {
      const response = await apiRequest('GET', `/api/patients/${patientId}/formsubmissions`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      throw error;
    }
  },

  /**
   * Fetch form submissions based on form type
   */
  async getFormSubmissionsByType(formType: 'urgent_care' | 'std_checkup'): Promise<FormSubmissionData> {
    try {
      const response = await apiRequest('GET', `/api/formsite/submissions?formType=${formType}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching form submissions by type:', error);
      throw error;
    }
  },

  /**
   * Create a new form submission
   */
  async createFormSubmission(submission: {
    patientId: number;
    formType: 'urgent_care' | 'std_checkup';
    formData: Record<string, any>;
    submissionId: string;
  }): Promise<FormSubmissionData> {
    try {
      const response = await apiRequest('POST', '/api/formsubmissions', submission);
      return await response.json();
    } catch (error) {
      console.error('Error creating form submission:', error);
      throw error;
    }
  }
};
