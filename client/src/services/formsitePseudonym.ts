import { apiRequest } from "@/lib/queryClient";

export interface PseudonymLookupResult {
  success: boolean;
  submission_id?: string;
  aiProcessedContent?: string;
  message?: string;
}

/**
 * Service for looking up FormSite submissions by pseudonym
 */
export const formsitePseudonymService = {
  /**
   * Look up a FormSite submission by pseudonym
   * This function will search for a form submission with the given pseudonym
   * and return the processed AI content if found
   *
   * @param pseudonym The pseudonym to search for
   * @returns The lookup result containing the AI processed content if found
   */
  async lookupByPseudonym(pseudonym: string): Promise<PseudonymLookupResult> {
    try {
      // Encode the pseudonym in case it contains special characters
      const encodedPseudonym = encodeURIComponent(pseudonym);
      const response = await apiRequest(
        "GET",
        `/api/formsite-pseudonym/lookup/${encodedPseudonym}`
      );
      return await response.json();
    } catch (error) {
      console.error(`Error looking up submission by pseudonym [${pseudonym}]:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to look up submission",
      };
    }
  },
};

export default formsitePseudonymService;
