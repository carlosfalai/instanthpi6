import axios from 'axios';
import { apiRequest } from '@/lib/queryClient';

export interface FormSiteSubmission {
  id: string;
  reference: string;
  status: string;
  date_submitted: string;
  results: Record<string, any>;
  processed?: boolean;
  aiProcessedContent?: string;
  claudeContent?: string;
}

export interface SearchResults {
  id: string;
  results: FormSiteSubmission[];
  [key: string]: any;
}

/**
 * Service for interacting with the FormSite API
 */
export const formsiteService = {
  /**
   * Fetch all form submissions
   */
  async getFormSubmissions(): Promise<FormSiteSubmission[]> {
    try {
      const response = await apiRequest('GET', '/api/formsite/submissions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      throw error;
    }
  },

  /**
   * Fetch a single form submission by ID
   */
  async getFormSubmission(id: string): Promise<FormSiteSubmission> {
    try {
      const response = await apiRequest('GET', `/api/formsite/submissions/${id}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching form submission ${id}:`, error);
      throw error;
    }
  },

  /**
   * Process a form submission with AI
   */
  async processFormSubmission(id: string): Promise<{ processed: boolean, aiContent: string, claudeContent: string }> {
    try {
      const response = await apiRequest('POST', `/api/formsite/submissions/${id}/process`, {});
      return await response.json();
    } catch (error) {
      console.error(`Error processing form submission ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search form submissions by patient name or other criteria
   * @returns Array of FormSiteSubmission objects or an object with results property
   */
  async searchFormSubmissions(query: string): Promise<FormSiteSubmission[] | SearchResults> {
    try {
      const response = await apiRequest('GET', `/api/formsite/submissions/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      // Server should always return an array, but just in case
      return Array.isArray(data) ? data : { id: 'search', results: Array.isArray(data.results) ? data.results : [] };
    } catch (error) {
      console.error('Error searching form submissions:', error);
      // Even on error, return an empty array to maintain consistent response format
      return [];
    }
  }
};

export default formsiteService;